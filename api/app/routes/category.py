from uuid import UUID

from fastapi import APIRouter

from app.domain.category import (
    INCOME,
    UNCATEGORIZED,
    Category,
    CategoryInput,
    PrimaryCategory,
    decode_category_input_model,
)
from app.routes import utils
from app.routes.router import BasicRouter
from app.storage.db import MenthaTable


class CategoryRouter(BasicRouter[Category, CategoryInput]):
    def __init__(self, table: MenthaTable[Category]) -> None:
        super().__init__(
            singular_name="category",
            plural_name="categories",
            domain_model=Category,
            input_model_decoder=decode_category_input_model,
            table=table,
        )

    def create_fastapi_router(self) -> APIRouter:
        router = super().create_fastapi_router()

        router.add_api_route(
            "/",
            self.get_all,
            summary="Get All Categories",
        )
        router.add_api_route(
            "/by-owner/{owner_id}",
            self.get_by_owner,
            summary="Get Categories By Owner",
        )

        return router

    async def add(self, input: CategoryInput) -> UUID:
        result = await super().add(input)
        return result

    async def update(self, id: UUID, input: CategoryInput) -> Category:
        result = await super().update(id, input)
        return result

    async def get_all(self) -> list[Category]:
        results = await self._table.query_async()
        return results

    async def get_by_owner(self, owner_id: UUID) -> list[PrimaryCategory]:
        raw = await self._table.query_async(owner=owner_id)
        # All owners are considered owners of the base system categories:
        raw += [INCOME, UNCATEGORIZED]
        return utils.assemble_primary_categories(raw)
