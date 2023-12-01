from typing import Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel


DomainModelT = TypeVar("DomainModelT", bound="DomainModel")
InputModelT = TypeVar("InputModelT", bound="InputModel")
ModelT = TypeVar("ModelT", "DomainModel", "InputModel")


class DomainModel(BaseModel):
    id: UUID


class InputModel(BaseModel):
    id: Optional[UUID] = None
