from typing import Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel


DomainModelType = TypeVar("DomainModelType", bound="DomainModel")
InputModelType = TypeVar("InputModelType", bound="InputModel")
ModelType = TypeVar("ModelType", "DomainModel", "InputModel")


class DomainModel(BaseModel):
    id: UUID


class InputModel(BaseModel):
    id: Optional[UUID] = None
