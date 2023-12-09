from uuid import UUID

from fastapi import APIRouter
from app.domain.category import SYSTEM_CATEGORIES, Category
from app.domain.core import PagedResultsModel
from app.domain.transaction import (
    Transaction,
    TransactionInput,
    decode_transaction_input_model,
)
from app.routes.router import BasicRouter
from app.storage.db import IsIn, MenthaDB
from app.storage.importer import Importer


class TransactionRouter(BasicRouter[Transaction[UUID], TransactionInput]):
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

        router.add_api_route(
            "/by-owner/{ownerId}",
            self.get_by_owner,
            summary="Get Transactions By Owner",
        )
        router.add_api_route(
            "/import/{ownerId}",
            self.import_transactions,
            summary="Import Transactions For Owner",
            methods=["POST"],
        )

        return router

    async def add(self, input: TransactionInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: TransactionInput) -> Transaction[UUID]:
        return await super().update(id, input)

    async def get_all(
        self, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Transaction[UUID]]:
        return await super().get_all(page, pageSize)

    async def get_by_owner(
        self, ownerId: UUID, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Transaction[Category]]:
        raw_results = await self._table.query_async(
            page=page, page_size=pageSize, owner=ownerId
        )
        cat_result = await self._db.categories.query_async(
            id=IsIn([row.category for row in raw_results.results])
        )
        categories = {cat.id: cat for cat in [*cat_result.results, *SYSTEM_CATEGORIES]}

        def _transform(tran: Transaction[UUID]) -> Transaction[Category]:
            return Transaction(
                id=tran.id,
                fitId=tran.fitId,
                amt=tran.amt,
                date=tran.date,
                name=tran.name,
                category=categories[tran.category],
                account=tran.account,
                owner=tran.owner,
            )

        return raw_results.broadcast_transform(_transform)

    async def import_transactions(self, ownerId: UUID) -> None:
        importer = Importer(for_owner=ownerId, db=self._db)
        await importer.refresh_rules()
        await importer.execute()
