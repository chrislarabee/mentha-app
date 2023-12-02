from uuid import UUID

from fastapi import APIRouter
from app.domain.category import SYSTEM_CATEGORIES, Category
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
            "/by-owner/{owner_id}",
            self.get_by_owner,
            summary="Get Transactions By Owner",
        )
        router.add_api_route(
            "/import/{owner_id}",
            self.import_transactions,
            summary="Import Transactions For Owner",
            methods=["POST"],
        )

        return router

    async def add(self, input: TransactionInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: TransactionInput) -> Transaction[UUID]:
        return await super().update(id, input)

    async def get_all(self) -> list[Transaction[UUID]]:
        return await super().get_all()

    async def get_by_owner(self, owner_id: UUID) -> list[Transaction[Category]]:
        raw_results = await self._table.query_async(owner=owner_id)
        categories = await self._db.categories.query_async(
            id=IsIn([row.category for row in raw_results])
        )
        cat_dict = {cat.id: cat for cat in [*categories, *SYSTEM_CATEGORIES]}
        return [
            Transaction(
                id=tran.id,
                fitId=tran.fitId,
                amt=tran.amt,
                date=tran.date,
                name=tran.name,
                category=cat_dict[tran.category],
                account=tran.category,
                owner=tran.owner,
            )
            for tran in raw_results
        ]

    async def import_transactions(self, owner_id: UUID) -> None:
        importer = Importer(for_owner=owner_id, db=self._db)
        await importer.refresh_rules()
        await importer.execute()
