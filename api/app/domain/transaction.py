from datetime import date, datetime
from typing import Generic, Optional, TypeVar
from uuid import UUID
from app.domain.category import UNCATEGORIZED, Category

from app.domain.core import DomainModel, InputModel

TRANSACTION_TABLE = "transactions"

CategoryT = TypeVar("CategoryT", UUID, Category)


class Transaction(DomainModel, Generic[CategoryT]):
    fitId: str
    amt: float
    date: date
    name: str
    category: CategoryT
    account: UUID
    owner: UUID


class TransactionInput(InputModel):
    fitId: str
    amt: float
    date: datetime
    name: str
    category: Optional[UUID]
    account: UUID
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID


def decode_transaction_input_model(
    uuid: UUID, input: TransactionInput
) -> Transaction[UUID]:
    return Transaction(
        id=uuid,
        fitId=input.fitId,
        amt=input.amt,
        date=input.date.date(),
        name=input.name,
        category=input.category or UNCATEGORIZED.id,
        account=input.account,
        owner=input.owner,
    )
