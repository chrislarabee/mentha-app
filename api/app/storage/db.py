from __future__ import annotations

import logging
import re
from abc import ABC, abstractmethod
from time import sleep
from typing import Any, Generic, Literal, Sequence
from uuid import UUID

import sqlalchemy as sa
import sqlalchemy.ext.asyncio as sasync

# These are imported separately to ease autocompletion of certain function overrides:
from sqlalchemy import Column, CursorResult, Delete, MetaData, Select, Table, Update
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncEngine

from app.domain.account import ACCOUNT_TABLE, Account
from app.domain.budget import BUDGET_TABLE, Budget
from app.domain.category import CATEGORY_TABLE, Category
from app.domain.core import DomainModelT, FilterModel, PagedResultsModel, SortModel
from app.domain.institution import INSTITUTION_TABLE, Institution
from app.domain.rule import RULE_TABLE, Rule
from app.domain.transaction import TRANSACTION_TABLE, Transaction
from app.storage import utils

MENTHA_DBNAME = "mentha-db"


class MenthaDB:
    def __init__(
        self,
        user: str,
        pwd: str,
        host: str,
        timeout_async: int = 30,
        pool_size_async: int = 5,
        max_overflow_async: int = 10,
        conn_attempts: int = 10,
    ) -> None:
        url = self.construct_db_url(user, pwd, host)
        self._metadata = MetaData()
        self._engine = sa.create_engine(url)
        self._engine_async = sasync.create_async_engine(
            self.construct_db_url(user, pwd, host, "async"),
            max_overflow=max_overflow_async,
            pool_size=pool_size_async,
            pool_timeout=timeout_async,
        )
        for i in range(conn_attempts):
            try:
                with self._engine.connect() as conn:
                    conn.execute(sa.text("select 1"))
                break
            except OperationalError as e:
                if i == conn_attempts - 1:
                    msg = "Failed to connect to db."
                    m = re.search(r"://.*?:(.*?)@", url)
                    if m:
                        start, end = m.span(1)
                        clean_url = url[:start] + "*****" + url[end:]
                        msg = f"Failed to connect to {clean_url}."
                    raise TimeoutError(f"{msg} Error = {e}.")
                if e.code != "e3q8":
                    raise e
                logging.info("Waiting for DB connection...")
                sleep(1)
        self._accounts = self._setup_table(
            domain_model=Account[UUID],
            table=ACCOUNT_TABLE,
        )
        self._budgets = self._setup_table(
            domain_model=Budget[UUID],
            table=BUDGET_TABLE,
        )
        self._categories = self._setup_table(
            domain_model=Category,
            table=CATEGORY_TABLE,
        )
        self._institutions = self._setup_table(
            domain_model=Institution,
            table=INSTITUTION_TABLE,
        )
        self._rules = self._setup_table(
            domain_model=Rule[UUID],
            table=RULE_TABLE,
        )
        self._transactions = self._setup_table(
            domain_model=Transaction[UUID],
            table=TRANSACTION_TABLE,
        )

    def _setup_table(
        self,
        domain_model: type[DomainModelT],
        table: str,
    ) -> MenthaTable[DomainModelT]:
        return MenthaTable(
            domain_model=domain_model,
            table=table,
            metadata=self._metadata,
            engine=self._engine,
            async_engine=self._engine_async,
        )

    @staticmethod
    def construct_db_url(
        user: str,
        pwd: str,
        host: str,
        mode: Literal["sync", "async"] = "sync",
    ) -> str:
        driver = "asyncpg" if mode == "async" else "psycopg"
        return f"postgresql+{driver}://{user}:{pwd}@{host}/{MENTHA_DBNAME}"

    @property
    def accounts(self) -> MenthaTable[Account[UUID]]:
        return self._accounts

    @property
    def budgets(self) -> MenthaTable[Budget[UUID]]:
        return self._budgets

    @property
    def categories(self) -> MenthaTable[Category]:
        return self._categories

    @property
    def institutions(self) -> MenthaTable[Institution]:
        return self._institutions

    @property
    def rules(self) -> MenthaTable[Rule[UUID]]:
        return self._rules

    @property
    def transactions(self) -> MenthaTable[Transaction[UUID]]:
        return self._transactions


class QueryOperation(ABC):
    def __init__(self, term: Any) -> None:
        self.term = term

    @abstractmethod
    def apply(self, select: Select[Any], column: Column[Any]) -> Select[Any]:
        return NotImplemented


# Keeping these distinct from domain.core.FilterOperator in case like/between/in
# are added as allowed FilterOperators (they would not be allowed here):
SIMPLE_OPS = ["=", ">", "<", ">=", "<="]
SimpleOperator = Literal["=", ">", "<", ">=", "<="]


class SimpleOp(QueryOperation):
    def __init__(self, term: Any, op: SimpleOperator) -> None:
        super().__init__(term)
        self.op = op

    def apply(self, select: Select[Any], column: Column[Any]) -> Select[Any]:
        return select.where(column.bool_op(self.op)(self.term))


class IsIn(QueryOperation):
    def __init__(self, term: Sequence[Any]) -> None:
        if len(term) > 0 and isinstance(term[0], UUID):
            term = [str(uuid) for uuid in term]
        unique_terms = {*term}
        super().__init__(unique_terms)

    def apply(self, select: Select[Any], column: Column[Any]) -> Select[Any]:
        return select.where(column.in_(self.term))


class Between(QueryOperation):
    def __init__(self, lower_bound: Any, upper_bound: Any) -> None:
        super().__init__((lower_bound, upper_bound))

    def apply(self, select: Select[Any], column: Column[Any]) -> Select[Any]:
        return select.where(sa.between(column, self.term[0], self.term[1]))


class Like(QueryOperation):
    def __init__(self, term: str) -> None:
        super().__init__(term)

    def apply(self, select: Select[Any], column: Column[Any]) -> Select[Any]:
        return select.where(column.like(self.term))


class MenthaTable(Generic[DomainModelT]):
    def __init__(
        self,
        domain_model: type[DomainModelT],
        table: str,
        metadata: MetaData,
        engine: Engine,
        async_engine: AsyncEngine,
    ) -> None:
        self._domain = domain_model
        self._table_name = table
        self._engine = engine
        self._async_engine = async_engine
        self._table = self._reflect_table(table, metadata, engine)

        self._pk = "id"

    @property
    def tablename(self) -> str:
        return self._table_name

    def dump_model(self, model: DomainModelT) -> dict[str, Any]:
        return utils.apply_snake_case(self._domain.model_dump(model))

    def load_row(self, row: sa.RowMapping) -> DomainModelT:
        return self._domain.model_validate(utils.apply_camelcase(dict(row)))

    def _gen_get_stmt(self, id: UUID) -> Select[Any]:
        return sa.select(self._table).where(self._table.c[self._pk] == str(id))

    def _return_get_result(self, result: CursorResult[Any]) -> DomainModelT | None:
        row = result.mappings().one_or_none()
        if row:
            return self.load_row(row)
        else:
            return None

    def get(self, id: UUID) -> DomainModelT | None:
        get_stmt = self._gen_get_stmt(id)
        with self._engine.connect() as conn:
            result = conn.execute(get_stmt)

        return self._return_get_result(result)

    async def get_async(self, id: UUID) -> DomainModelT | None:
        get_stmt = self._gen_get_stmt(id)
        async with self._async_engine.connect() as conn:
            result = await conn.execute(get_stmt)

        return self._return_get_result(result)

    def insert(self, *models: DomainModelT) -> None:
        rows = [self.dump_model(model) for model in models]
        with self._engine.begin() as conn:
            conn.execute(self._table.insert().values(rows))

    async def insert_async(self, *models: DomainModelT) -> None:
        rows = [self.dump_model(model) for model in models]

        # AsyncEngine doesn't convert UUIDs to strings like Engine does:
        for row in rows:
            for k, v in row.items():
                if isinstance(v, UUID):
                    row[k] = str(v)

        async with self._async_engine.begin() as conn:
            await conn.execute(self._table.insert().values(rows))

    def _gen_update_stmt(self, model: DomainModelT, sanitize: bool = False) -> Update:
        row = self.dump_model(model)
        id = row.pop(self._pk)
        if sanitize:
            # AsyncEngine doesn't convert UUIDs to strings like Engine does:
            for k, v in row.items():
                if isinstance(v, UUID):
                    row[k] = str(v)
        update = (
            self._table.update().where(self._table.c[self._pk] == str(id)).values(**row)
        )
        return update

    def update(self, model: DomainModelT) -> None:
        update_stmt = self._gen_update_stmt(model)
        with self._engine.begin() as conn:
            conn.execute(update_stmt)

    async def update_async(self, model: DomainModelT) -> None:
        update_stmt = self._gen_update_stmt(model, sanitize=True)
        async with self._async_engine.begin() as conn:
            await conn.execute(update_stmt)

    def _gen_delete_stmt(self, id: UUID) -> Delete:
        return sa.delete(self._table).where(self._table.c[self._pk] == str(id))

    def delete(self, id: UUID) -> None:
        current = self.get(id)
        if current:
            delete_stmt = self._gen_delete_stmt(id)
            with self._engine.begin() as conn:
                conn.execute(delete_stmt)

    async def delete_async(self, id: UUID) -> None:
        current = await self.get_async(id)
        if current:
            delete_stmt = self._gen_delete_stmt(id)
            async with self._async_engine.begin() as conn:
                await conn.execute(delete_stmt)

    def _apply_query_args(
        self,
        q: Select[Any],
        q_args: dict[str, QueryOperation | FilterModel | Any],
    ) -> Select[Any]:
        for field, arg in q_args.items():
            field = utils.apply_snake_case(field)
            if isinstance(arg, QueryOperation):
                q = arg.apply(q, self._table.c[field])
            elif isinstance(arg, FilterModel):
                if arg.op == "like":
                    q = Like(arg.term).apply(q, self._table.c[field])
                elif arg.op in SIMPLE_OPS:
                    q = SimpleOp(arg.term, arg.op).apply(q, self._table.c[field])
            else:
                arg = str(arg) if isinstance(arg, UUID) else arg
                q = q.where(self._table.c[field] == arg)
        return q

    def _construct_col_sort(self, s: str | SortModel) -> sa.ColumnElement[Any]:
        if isinstance(s, SortModel):
            column = self._table.c[utils.apply_snake_case(s.field)]
            return sa.desc(column) if s.direction == "desc" else column
        else:
            return self._table.c[utils.apply_snake_case(s)]

    def _apply_sorts(
        self,
        q: Select[Any],
        sorts: list[str | SortModel] | list[SortModel] | list[str] | None = None,
    ) -> Select[Any]:
        sorts = sorts or []
        sql_sorts = [self._construct_col_sort(s) for s in sorts]
        return q.order_by(*sql_sorts)

    def _generate_query(
        self,
        page: int,
        page_size: int | None,
        q_args: dict[str, QueryOperation | FilterModel | Any],
        sorts: list[str | SortModel] | list[SortModel] | list[str] | None = None,
    ) -> tuple[Select[Any], int | None]:
        q = self._table.select()
        q = self._apply_sorts(q, sorts)
        mod_pg_size = page_size
        if page_size:
            mod_pg_size = page_size + 1
            q = q.limit(mod_pg_size)
            q = q.offset((page - 1) * page_size)
        q = self._apply_query_args(q, q_args)
        return q, mod_pg_size

    @staticmethod
    def _postprocess_query_result(
        total_hit_count: int,
        page: int,
        page_size: int | None,
        result: list[DomainModelT],
    ) -> PagedResultsModel[DomainModelT]:
        hasNext = False
        page_size = page_size if page_size is None else page_size - 1
        if page_size is not None:
            hasNext = True if page * page_size < total_hit_count else False
            result = result[:page_size]
        return PagedResultsModel(
            results=result,
            totalHitCount=total_hit_count,
            hitCount=len(result),
            page=page,
            pageSize=page_size,
            hasNext=hasNext,
            hasPrev=page > 1,
        )

    def query(
        self,
        page: int = 1,
        page_size: int | None = None,
        sorts: list[str | SortModel] | list[SortModel] | list[str] | None = None,
        **query_args: QueryOperation | FilterModel | Any,
    ) -> PagedResultsModel[DomainModelT]:
        """
        Runs a query on the table using the passed kwargs. If you pass one of the
        QueryOperations in this module then that special behavior will be used,
        otherwise, whatever k=v pair you put in the kwargs will be used in a simple
        where k = v clause on the table.

        Returns:
            list[DomainModelType]: The list of Domain Models matching your query,
            if any.
        """
        q, page_size = self._generate_query(
            page=page, page_size=page_size, q_args=query_args, sorts=sorts
        )
        count_q = self._generate_count_query(query_args)

        with self._engine.connect() as conn:
            count = conn.execute(count_q).scalar_one()
            result = conn.execute(q)
            rows = [self.load_row(row) for row in result.mappings()]

        return self._postprocess_query_result(count, page, page_size, rows)

    async def query_async(
        self,
        page: int = 1,
        page_size: int | None = None,
        sorts: list[str | SortModel] | list[SortModel] | list[str] | None = None,
        **query_args: QueryOperation | Any,
    ) -> PagedResultsModel[DomainModelT]:
        """
        Runs a query on the table using the passed kwargs. If you pass one of the
        QueryOperations in this module then that special behavior will be used,
        otherwise, whatever k=v pair you put in the kwargs will be used in a simple
        where k = v clause on the table.

        Returns:
            list[DomainModelType]: The list of Domain Models matching your query,
            if any.
        """
        q, page_size = self._generate_query(
            page=page, page_size=page_size, q_args=query_args, sorts=sorts
        )
        count_q = self._generate_count_query(query_args)

        async with self._async_engine.connect() as conn:
            count_result = await conn.execute(count_q)
            count = count_result.scalar_one()
            result = await conn.execute(q)
            rows = [self.load_row(row) for row in result.mappings()]

        return self._postprocess_query_result(count, page, page_size, rows)

    def _generate_count_query(
        self, query_args: dict[str, QueryOperation | Any]
    ) -> Select[Any]:
        q = self._table.select()
        q = q.with_only_columns(sa.func.count(self._table.columns[self._pk]))
        q = self._apply_query_args(q, query_args)
        return q

    def count(self, **query_args: QueryOperation | Any) -> int:
        q = self._generate_count_query(query_args)
        with self._engine.connect() as conn:
            result = conn.execute(q)

        return result.scalar_one()

    async def count_async(self, **query_args: QueryOperation | Any) -> int:
        q = self._generate_count_query(query_args)
        async with self._async_engine.connect() as conn:
            result = await conn.execute(q)

        return result.scalar_one()

    @staticmethod
    def _reflect_table(table: str, metadata: MetaData, engine: Engine) -> Table:
        tbl = Table(table, metadata, autoload_with=engine)
        return tbl
