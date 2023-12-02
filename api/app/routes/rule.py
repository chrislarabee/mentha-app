from uuid import UUID

from fastapi import APIRouter
from app.domain.category import SYSTEM_CATEGORIES, Category
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
            "/by-owner/{owner_id}",
            self.get_by_owner,
            summary="Get Rules By Owner",
        )

        return router

    async def add(self, input: RuleInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: RuleInput) -> Rule[UUID]:
        return await super().update(id, input)

    async def get_all(self) -> list[Rule[UUID]]:
        return await super().get_all()

    async def get_by_owner(self, owner_id: UUID) -> list[Rule[Category]]:
        raw_results = await self._table.query_async(owner=owner_id)
        categories = await self._cat_table.query_async(
            id=IsIn([row.resultCategory for row in raw_results])
        )
        cat_dict = {cat.id: cat for cat in [*categories, *SYSTEM_CATEGORIES]}
        return [
            Rule(
                id=rule.id,
                priority=rule.priority,
                resultCategory=cat_dict[rule.resultCategory],
                owner=rule.owner,
                matchName=rule.matchName,
            )
            for rule in raw_results
        ]
