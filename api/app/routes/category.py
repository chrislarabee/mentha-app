from uuid import UUID

from app.domain.category import Category, CategoryInput, decode_category_input_model
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

    async def add(self, input: CategoryInput) -> UUID:
        result = await super().add(input)
        return result

    async def update(self, id: UUID, input: CategoryInput) -> Category:
        result = await super().update(id, input)
        return result
