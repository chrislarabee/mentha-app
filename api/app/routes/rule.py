from uuid import UUID

from fastapi import APIRouter
from app.domain.category import SYSTEM_CATEGORIES, Category
from app.domain.core import PagedResultsModel
from app.domain.rule import Rule, RuleInput, decode_rule_input_model
from app.routes.router import BasicRouter
from app.storage.db import IsIn, MenthaTable


class RuleRouter(BasicRouter[Rule[UUID], RuleInput]):
    def __init__(
        self,
        rule_table: MenthaTable[Rule[UUID]],
        category_table: MenthaTable[Category],
    ) -> None:
        super().__init__(
            singular_name="rule",
            plural_name="rules",
            domain_model=Rule[UUID],
            input_model_decoder=decode_rule_input_model,
            table=rule_table,
        )
        self._cat_table = category_table

    def create_fastapi_router(self) -> APIRouter:
        router = super().create_fastapi_router()

        router.add_api_route(
            "/by-owner/{ownerId}",
            self.get_by_owner,
            summary="Get Rules By Owner",
        )

        return router

    async def add(self, input: RuleInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: RuleInput) -> Rule[UUID]:
        return await super().update(id, input)

    async def get_all(
        self, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Rule[UUID]]:
        return await super().get_all(page, pageSize)

    async def get_by_owner(self, ownerId: UUID) -> PagedResultsModel[Rule[Category]]:
        raw_results = await self._table.query_async(owner=ownerId)
        cat_result = await self._cat_table.query_async(
            id=IsIn([row.resultCategory for row in raw_results.results])
        )
        categories = {cat.id: cat for cat in [*cat_result.results, *SYSTEM_CATEGORIES]}

        def _transform(rule: Rule[UUID]) -> Rule[Category]:
            return Rule(
                id=rule.id,
                priority=rule.priority,
                resultCategory=categories[rule.resultCategory],
                owner=rule.owner,
                matchName=rule.matchName,
            )

        return raw_results.broadcast_transform(_transform)
