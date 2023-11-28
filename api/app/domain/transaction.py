from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID
from app.domain.category import Category

from app.domain.core import DomainModel

CategoryType = TypeVar("CategoryType", UUID, Category)

TRANSACTION_TABLE = "transactions"


class Transaction(DomainModel, Generic[CategoryType]):
    fitId: str
    amt: float
    date: datetime
    name: str
    category: CategoryType
    account: UUID
    owner: UUID
