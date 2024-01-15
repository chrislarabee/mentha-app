from datetime import date, datetime
from typing import Generic, Optional, TypeVar
from uuid import UUID

from app.domain.category import Category
from app.domain.core import DomainModel, InputModel
from app.domain.user import SYSTEM_USER

BUDGET_TABLE = "budgets"

CategoryT = TypeVar("CategoryT", UUID, Category)


class Budget(DomainModel, Generic[CategoryT]):
    category: CategoryT
    amt: float
    period: int
    createDate: date
    inactiveDate: Optional[date] = None
    owner: UUID


class AllocatedBudget(DomainModel):
    category: Category
    amt: float
    monthAmt: float
    accumulatedAmt: float
    allocatedAmt: float
    period: int
    createDate: date
    inactiveDate: Optional[date] = None
    owner: UUID


class BudgetInput(InputModel):
    category: UUID
    amt: float
    period: int
    createDate: datetime
    inactiveDate: Optional[datetime] = None
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID


def decode_budget_input_model(uuid: UUID, input: BudgetInput) -> Budget[UUID]:
    # All budget dates are effectively just year and month, so inputs are
    # standardized to the first day of the month:
    def _transform_month_datetime(dt: datetime) -> date:
        return date(dt.year, dt.month, 1)

    inactive_date = (
        _transform_month_datetime(input.inactiveDate) if input.inactiveDate else None
    )

    return Budget(
        id=uuid,
        category=input.category,
        amt=input.amt,
        period=input.period,
        createDate=_transform_month_datetime(input.createDate),
        inactiveDate=inactive_date,
        owner=input.owner,
    )


UNALLOCATED_BGT = UUID("df9b14f9-829a-4758-bee7-05a380654b91")
UNALLOCATED_CATEGORY = Category(
    id=UUID("0d495bad-c52e-49cb-826e-29285153c812"),
    name="Unallocated",
    owner=SYSTEM_USER.id,
)
