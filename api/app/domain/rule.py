from typing import Generic, Optional, TypeVar
from uuid import UUID
from app.domain.category import Category
from app.domain.core import DomainModel, InputModel

RULE_TABLE = "rules"

CategoryT = TypeVar("CategoryT", UUID, Category)


class Rule(DomainModel, Generic[CategoryT]):
    priority: int
    resultCategory: CategoryT
    owner: UUID
    matchName: Optional[str]


class RuleInput(InputModel):
    priority: int
    resultCategory: UUID
    # TODO: Remove this once it can be discerned by the API from the user:
    owner: UUID
    matchName: Optional[str]


def decode_rule_input_model(uuid: UUID, input: RuleInput) -> Rule[UUID]:
    return Rule(
        id=uuid,
        priority=input.priority,
        resultCategory=input.resultCategory,
        owner=input.owner,
        matchName=input.matchName,
    )
