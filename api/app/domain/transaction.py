from datetime import datetime
from typing import Generic
from uuid import UUID
from app.domain.category import CategoryT

from app.domain.core import DomainModel

TRANSACTION_TABLE = "transactions"


class Transaction(DomainModel, Generic[CategoryT]):
    fitId: str
    amt: float
    date: datetime
    name: str
    category: CategoryT
    account: UUID
    owner: UUID
