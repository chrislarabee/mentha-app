from datetime import date, datetime
from typing import Generic, Literal, Optional, TypeVar
from uuid import UUID

from app.domain.category import UNCATEGORIZED, Category
from app.domain.core import DomainModel, InputModel

TRANSACTION_TABLE = "transactions"

CategoryT = TypeVar("CategoryT", UUID, Category)
TransactionType = Literal["credit", "debit"]


class Transaction(DomainModel, Generic[CategoryT]):
    fitId: str
    amt: float
    type: TransactionType
    date: date
    name: str
    category: CategoryT
    account: UUID
    owner: UUID


class TransactionInput(InputModel):
    fitId: str
    amt: float
    type: TransactionType
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
        amt=abs(input.amt),
        date=input.date.date(),
        name=input.name,
        category=input.category or UNCATEGORIZED.id,
        account=input.account,
        owner=input.owner,
        type=input.type,
    )
