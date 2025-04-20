from typing import Optional
from uuid import UUID

from app.domain.core import DomainModel, InputModel
from app.domain.user import SYSTEM_USER

CATEGORY_TABLE = "categories"
DEFAULT_CATEGORY_ID = UUID("6c47e0cc-b47c-4661-bda3-8e8077fed6c7")


class Category(DomainModel):
    name: str
    parentCategory: Optional[UUID] = None
    owner: UUID


class CategoryInput(InputModel):
    name: str
    parentCategory: Optional[UUID] = None
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID


class Subcategory(DomainModel):
    name: str
    parentCategory: UUID
    owner: UUID


class PrimaryCategory(DomainModel):
    name: str
    owner: UUID
    subcategories: list[Subcategory]


def decode_category_input_model(uuid: UUID, input: CategoryInput) -> Category:
    return Category(
        id=uuid,
        name=input.name,
        parentCategory=input.parentCategory,
        owner=input.owner,
    )


UNCATEGORIZED = Category(
    id=UUID("6c47e0cc-b47c-4661-bda3-8e8077fed6c7"),
    name="Uncategorized",
    owner=SYSTEM_USER.id,
)
INCOME = Category(
    id=UUID("a3720dcc-0ba4-426d-9c41-620a0fbe0ad6"),
    name="Income",
    owner=SYSTEM_USER.id,
)
REFUND = Category(
    id=UUID("7251dda2-7f20-4fd6-9e23-3d5e1b0145ce"),
    name="Return / Reimbursement / Refund",
    owner=SYSTEM_USER.id,
)
TRANSFER = Category(
    id=UUID("c37846fa-1ee0-4e1d-95dd-5c46e13e08c8"),
    name="Transfer",
    owner=SYSTEM_USER.id,
)

SYSTEM_CATEGORIES = [
    UNCATEGORIZED,
    INCOME,
    REFUND,
    TRANSFER,
]
