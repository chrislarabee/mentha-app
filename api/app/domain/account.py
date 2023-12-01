from __future__ import annotations

from typing import Generic, Literal, TypeVar
from uuid import UUID
from app.domain.core import DomainModel, InputModel
from app.domain.institution import InstitutionT


ACCOUNT_TABLE = "accounts"

ACCOUNT_TYPES = ["Checking", "Savings"]
AccountType = Literal["Checking", "Savings"]
AccountT = TypeVar("AccountT", UUID, "Account[UUID]")


class Account(DomainModel, Generic[InstitutionT]):
    fitId: str
    accountType: AccountType
    name: str
    institution: InstitutionT
    owner: UUID


class AccountInput(InputModel):
    fitId: str
    accountType: AccountType
    name: str
    institution: UUID
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID


def decode_account_input_model(uuid: UUID, input: AccountInput) -> Account[UUID]:
    return Account(
        id=uuid,
        fitId=input.fitId,
        accountType=input.accountType,
        name=input.name,
        institution=input.institution,
        owner=input.owner,
    )
