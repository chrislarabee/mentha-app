from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID
from pydantic import BaseModel

from app.domain.category import Category

CategoryT = TypeVar("CategoryT", UUID, Category)


class TrendByMonth(BaseModel):
    date: datetime


class NetIncomeByMonth(TrendByMonth):
    income: float
    expense: float
    net: float


class CategorySpendingByMonth(TrendByMonth, Generic[CategoryT]):
    category: CategoryT
    amt: float
