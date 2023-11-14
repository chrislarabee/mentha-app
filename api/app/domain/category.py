from typing import Optional
from uuid import UUID

from app.domain.core import DomainModel, InputModel

CATEGORY_TABLE = "categories"
DEFAULT_CATEGORY_ID = UUID("6c47e0cc-b47c-4661-bda3-8e8077fed6c7")


class Category(DomainModel):
    name: str
    parentCategory: Optional[UUID] = None
    owner: UUID


class CategoryInput(InputModel):
    name: str
    parentCategory: Optional[UUID] = None
    # TODO: Remove this:
    owner: UUID


def decode_category_input_model(uuid: UUID, input: CategoryInput) -> Category:
    return Category(
        id=uuid,
        name=input.name,
        parentCategory=input.parentCategory,
        owner=input.owner,
    )
