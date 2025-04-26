from typing import Optional
from uuid import UUID
from app.domain.core import DomainModel, InputModel

INSTITUTION_TABLE = "institutions"


class Institution(DomainModel):
    name: str
    fitId: str
    transFitIdPat: Optional[str] = None


class InstitutionInput(InputModel):
    name: str
    fitId: str
    transFitIdPat: Optional[str] = None


def decode_institution_input_model(uuid: UUID, input: InstitutionInput) -> Institution:
    return Institution(
        id=uuid,
        name=input.name,
        fitId=input.fitId,
        transFitIdPat=input.transFitIdPat,
    )
