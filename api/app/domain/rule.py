import re
import operator
from typing import Any, Callable, Generic, Optional, TypeVar
from uuid import UUID
from app.domain.category import Category
from app.domain.core import DataIntegrityError, DomainModel, InputModel
from app.domain.transaction import Transaction, TransactionType

RULE_TABLE = "rules"

CategoryT = TypeVar("CategoryT", UUID, Category)

MATCH_AMT_PAT = r"(=|<=|>=|[><])?(-?[\d\.]*)"


class Rule(DomainModel, Generic[CategoryT]):
    priority: int
    resultCategory: CategoryT
    owner: UUID
    matchName: Optional[str]
    matchAmt: Optional[str]
    matchType: Optional[TransactionType]


class RuleInput(InputModel):
    priority: int
    resultCategory: UUID
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID
    matchName: Optional[str] = None
    matchAmt: Optional[str] = None
    matchType: Optional[TransactionType] = None


def decode_rule_input_model(uuid: UUID, input: RuleInput) -> Rule[UUID]:
    if input.matchAmt:
        pattern_check = re.match(MATCH_AMT_PAT, input.matchAmt)
        if not pattern_check or pattern_check.groups()[1] == "":
            raise DataIntegrityError(
                "matchAmt must be in the format of <>/= followed by a numeric value",
                "matchAmt",
                input.matchAmt,
            )
    return Rule(
        id=uuid,
        priority=input.priority,
        resultCategory=input.resultCategory,
        owner=input.owner,
        matchName=input.matchName,
        matchAmt=input.matchAmt,
        matchType=input.matchType,
    )


def check_rule_against_transaction(
    rule: Rule[UUID], trn_input: Transaction[UUID]
) -> Optional[UUID]:
    match_dict = dict[str, bool]()
    result: UUID | None = None
    if rule.matchName:
        match = re.search(
            re.compile(rule.matchName, flags=re.IGNORECASE), trn_input.name
        )
        match_dict["match_name"] = match is not None
    if rule.matchAmt:
        error_msg = "Could not parse matchAmt pattern:"
        match_dict["match_amt"] = False
        pat_match = re.match(MATCH_AMT_PAT, rule.matchAmt)
        if not pat_match or pat_match.groups()[1] == "":
            raise DataIntegrityError(error_msg, "matchAmt", rule.matchAmt)
        else:
            ops: dict[str, Callable[[Any, Any], bool]] = {
                "=": operator.eq,
                ">": operator.gt,
                "<": operator.lt,
                ">=": operator.ge,
                "<=": operator.le,
            }
            op, amt = pat_match.groups()
            opfunc = operator.eq if op is None else ops[op]
            try:
                amt = float(amt)
            except ValueError:
                raise DataIntegrityError(error_msg, "matchAmt", rule.matchAmt)
            match_dict["match_amt"] = opfunc(trn_input.amt, amt)
    if rule.matchType:
        match_dict["match_type"] = trn_input.type == rule.matchType
    # Currently all match values must match:
    if sum(match_dict.values()) == len(match_dict):
        result = rule.resultCategory
    return result
