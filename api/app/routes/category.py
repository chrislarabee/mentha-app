from uuid import UUID

from fastapi import APIRouter

from app.domain.category import (
    SYSTEM_CATEGORIES,
    Category,
    CategoryInput,
    PrimaryCategory,
    decode_category_input_model,
)
from app.domain.core import PagedResultsModel, QueryModel
from app.routes import utils
from app.routes.router import BasicRouter, ByOwnerMethods
from app.storage.db import MenthaTable


class CategoryRouter(
    BasicRouter[Category, CategoryInput], ByOwnerMethods[PrimaryCategory]
):
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

        self.apply_methods_to_fastapi_router(router, self._plural)

        router.add_api_route(
            "/by-owner/{ownerId}/flat",
            self.get_all_by_owner,
            summary="Get Categories By Owner (Flattened)",
        )

        return router

    async def add(self, input: CategoryInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: CategoryInput) -> Category:
        return await super().update(id, input)

    async def get_all(
        self, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Category]:
        return await super().get_all(query, page, pageSize)

    async def get_by_owner(
        self, ownerId: UUID, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[PrimaryCategory]:
        raw_result = await self._table.query_async(
            page=page,
            page_size=pageSize,
            sorts=query.sorts,
            owner=ownerId,
            **utils.preprocess_filters(query.filters)
        )

        def _transform(results: list[Category]) -> list[PrimaryCategory]:
            # All owners are considered owners of the base system categories:
            results += SYSTEM_CATEGORIES
            return utils.assemble_primary_categories(results)

        return raw_result.transform(_transform)

    async def get_all_by_owner(self, ownerId: UUID) -> PagedResultsModel[Category]:
        raw_result = await self._table.query_async(owner=ownerId)

        def _transform(results: list[Category]) -> list[Category]:
            results += SYSTEM_CATEGORIES
            return results

        return raw_result.transform(_transform)
