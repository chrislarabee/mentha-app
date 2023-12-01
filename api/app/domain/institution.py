from typing import TypeVar
from uuid import UUID
from app.domain.core import DomainModel, InputModel

INSTITUTION_TABLE = "institutions"

InstitutionT = TypeVar("InstitutionT", UUID, "Institution")


class Institution(DomainModel):
    name: str
    fitId: str


class InstitutionInput(InputModel):
    name: str
    fitId: str


def decode_institution_input_model(uuid: UUID, input: InstitutionInput) -> Institution:
    return Institution(
        id=uuid,
        name=input.name,
        fitId=input.fitId,
    )
