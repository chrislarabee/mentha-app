from datetime import date, datetime
import re
from typing import Generic, Literal, Optional, TypeVar
from uuid import UUID

from app.domain.category import UNCATEGORIZED, Category
from app.domain.core import DomainModel, InputModel
from app.storage.ofx import OFXTransaction

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


def parse_transaction_fit_id(fit_id: str, pat: str | None = None) -> str:
    """
    Checks the passed fit_id to see if it matches the passed regex pattern (if any).
    Optionally returns a subset of the match if 1 group is included in the pattern.

    Args:
        fit_id (str): The fit_id string to analyze.
        pat (str | None, optional): Pattern to match against, you may include up to
        1 group (e.g. (.*)), in which case matches for that group will be returned
        rather than the unmodified fit_id. Defaults to None, which will result in the
        unmodified fit_id being returned.

    Raises:
        ValueError: If the fit_id does not match the pattern, or if you pass
        a pattern that has more than one regex group.

    Returns:
        str: The fit_id, optionally modified as described in `pat`, above.
    """
    if pat:
        m = re.match(pat, fit_id)
        if not m:
            raise ValueError(
                f"Unexpected fit_id does not match provided pattern ({pat}): "
                f"{fit_id}"
            )
        else:
            grps = m.groups()
            if len(grps) > 1:
                raise ValueError(
                    "Cannot parse fit_id with a pattern that has more than 1 "
                    f"group: ({pat})"
                )
            elif len(grps) == 1:
                fit_id = grps[0]
    return fit_id


def decode_ofx_transaction(
    trn_id: UUID,
    ofxtrn: OFXTransaction,
    acct_id: UUID,
    owner_id: UUID,
    tran_fit_id_pat: str | None = None,
) -> Transaction[UUID]:
    fit_id = parse_transaction_fit_id(ofxtrn.fit_id, pat=tran_fit_id_pat)
    return Transaction(
        id=trn_id,
        fitId=fit_id,
        amt=abs(ofxtrn.trn_amt),
        type="debit" if ofxtrn.trn_amt < 0 else "credit",
        date=ofxtrn.dt_posted,
        name=ofxtrn.name,
        category=UNCATEGORIZED.id,
        account=acct_id,
        owner=owner_id,
    )
