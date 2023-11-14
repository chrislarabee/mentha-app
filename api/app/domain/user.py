from uuid import UUID
from app.domain.core import DomainModel

USER_TABLE = "users"


class User(DomainModel):
    name: str


SYSTEM_USER = User(
    id=UUID("9b4923d8-53aa-4f40-b602-9e4765420c07"),
    name="System",
)

IMPORT_USER = User(
    id=UUID("4b779c07-cc09-4ee9-8393-fd36af0b00df"),
    name="Import",
)
