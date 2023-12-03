from uuid import UUID
from app.domain.core import PagedResultsModel
from app.domain.institution import (
    Institution,
    InstitutionInput,
    decode_institution_input_model,
)

from app.routes.router import BasicRouter
from app.storage.db import MenthaTable


class InstitutionRouter(BasicRouter[Institution, InstitutionInput]):
    def __init__(
        self,
        table: MenthaTable[Institution],
    ) -> None:
        super().__init__(
            singular_name="institution",
            plural_name="institutions",
            domain_model=Institution,
            input_model_decoder=decode_institution_input_model,
            table=table,
        )

    async def add(self, input: InstitutionInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: InstitutionInput) -> Institution:
        return await super().update(id, input)

    async def get_all(
        self, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Institution]:
        return await super().get_all(page, pageSize)
