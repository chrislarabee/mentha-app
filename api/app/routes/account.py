from uuid import UUID

from fastapi import APIRouter

from app.domain.account import (
    Account,
    AccountInput,
    decode_account_input_model,
)
from app.domain.core import PagedResultsModel, QueryModel
from app.domain.institution import Institution
from app.routes.router import BasicRouter, ByOwnerMethods
from app.routes.utils import preprocess_filters
from app.storage.db import IsIn, MenthaTable


class AccountRouter(
    BasicRouter[Account[UUID], AccountInput], ByOwnerMethods[Account[Institution]]
):
    def __init__(
        self,
        account_table: MenthaTable[Account[UUID]],
        institution_table: MenthaTable[Institution],
    ) -> None:
        super().__init__(
            singular_name="account",
            plural_name="accounts",
            domain_model=Account[UUID],
            input_model_decoder=decode_account_input_model,
            table=account_table,
        )
        self._inst_table = institution_table

    def create_fastapi_router(self) -> APIRouter:
        router = super().create_fastapi_router()
        self.apply_methods_to_fastapi_router(router, self._plural)
        return router

    async def add(self, input: AccountInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: AccountInput) -> Account[UUID]:
        return await super().update(id, input)

    async def get_all(
        self, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Account[UUID]]:
        return await super().get_all(query, page, pageSize)

    async def get_by_owner(
        self, ownerId: UUID, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Account[Institution]]:
        raw_results = await self._table.query_async(
            page=page,
            page_size=pageSize,
            sorts=query.sorts,
            owner=ownerId,
            **preprocess_filters(query.filters)
        )
        inst_result = await self._inst_table.query_async(
            id=IsIn([row.institution for row in raw_results.results])
        )
        institutions = {inst.id: inst for inst in inst_result.results}

        def _transform(acct: Account[UUID]) -> Account[Institution]:
            return Account(
                id=acct.id,
                fitId=acct.fitId,
                accountType=acct.accountType,
                name=acct.name,
                institution=institutions[acct.institution],
                owner=acct.owner,
            )

        return raw_results.broadcast_transform(_transform)
