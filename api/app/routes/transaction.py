from uuid import UUID

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse

from app.domain.category import UNCATEGORIZED, Category
from app.domain.core import PagedResultsModel, QueryModel
from app.domain.rule import check_rule_against_transaction
from app.domain.transaction import (
    OutputTransaction,
    Transaction,
    TransactionInput,
    decode_transaction_input_model,
)
from app.routes.router import BasicRouter, ByOwnerMethods
from app.routes.utils import get_categories_by_id, preprocess_filters
from app.storage.db import MenthaDB
from app.storage.importer import Importer


class TransactionRouter(
    BasicRouter[Transaction[UUID], TransactionInput],
    ByOwnerMethods[OutputTransaction],
):
    def __init__(self, mentha_db: MenthaDB) -> None:
        super().__init__(
            singular_name="transaction",
            plural_name="transactions",
            domain_model=Transaction[UUID],
            input_model_decoder=decode_transaction_input_model,
            table=mentha_db.transactions,
        )
        self._db = mentha_db

    def create_fastapi_router(self) -> APIRouter:
        router = super().create_fastapi_router()

        self.apply_methods_to_fastapi_router(router, self._plural)

        router.add_api_route(
            "/import/{ownerId}",
            self.import_transactions,
            summary="Import Transactions For Owner",
            methods=["POST"],
        )
        router.add_api_route(
            "/apply-rules/{ownerId}",
            self.apply_rules,
            summary="Apply Rules to Owned Transactions",
            methods=["PUT"],
        )

        return router

    async def add(self, input: TransactionInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: TransactionInput) -> Transaction[UUID]:
        return await super().update(id, input)

    async def get_all(
        self, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Transaction[UUID]]:
        return await super().get_all(query, page, pageSize)

    async def get_by_owner(
        self,
        ownerId: UUID,
        query: QueryModel,
        page: int = 1,
        pageSize: int = 50,
    ) -> PagedResultsModel[OutputTransaction]:
        raw_results = await self._table.query_async(
            page=page,
            page_size=pageSize,
            sorts=query.sorts,
            owner=ownerId,
            **preprocess_filters(query.filters),
        )
        categories = await get_categories_by_id(
            self._db.categories, [row.category for row in raw_results.results]
        )

        return raw_results.broadcast_transform(
            lambda tran: self._transform(tran, categories)
        )

    async def import_transactions(self, ownerId: UUID) -> JSONResponse:
        importer = Importer(for_owner=ownerId, db=self._db)
        await importer.refresh_rules()
        result = await importer.execute()
        return JSONResponse(f"Imported {result} transactions.")

    async def apply_rules(
        self,
        ownerId: UUID,
        background_tasks: BackgroundTasks,
        uncategorizedOnly: bool = False,
    ) -> None:
        rules = await self._db.rules.query_async(owner=ownerId, page_size=500)
        params = {"owner": ownerId}
        if uncategorizedOnly:
            params["category"] = UNCATEGORIZED.id

        async def _execute() -> None:
            pg = 1
            while True:
                to_update = list[Transaction[UUID]]()
                transactions = await self._table.query_async(
                    page=pg, page_size=100, sorts=[], **params
                )
                for trn in transactions.results:
                    for rule in rules.results:
                        new_cat = check_rule_against_transaction(rule, trn)
                        if new_cat:
                            trn.category = new_cat
                            to_update.append(trn)
                            break
                for trn in to_update:
                    await self._table.update_async(trn)
                if not transactions.hasNext:
                    break
                else:
                    pg += 1

        background_tasks.add_task(_execute)

    @staticmethod
    def _transform(
        tran: Transaction[UUID], categories: dict[UUID, Category]
    ) -> OutputTransaction:
        return OutputTransaction(
            id=tran.id,
            fitId=tran.fitId,
            amt=abs(tran.amt),
            type="credit" if tran.amt > 0 else "debit",
            date=tran.date,
            name=tran.name,
            category=categories[tran.category],
            account=tran.account,
            owner=tran.owner,
        )
