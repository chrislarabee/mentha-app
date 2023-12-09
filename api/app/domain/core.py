from __future__ import annotations

from typing import Any, Callable, Generic, Literal, Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel, Field


DomainModelT = TypeVar("DomainModelT", bound="DomainModel")
DomainModelT2 = TypeVar("DomainModelT2", bound="DomainModel")
InputModelT = TypeVar("InputModelT", bound="InputModel")
ModelT = TypeVar("ModelT", "DomainModel", "InputModel")


class DataIntegrityError(Exception):
    def __init__(self, msg: str, invalid_field: str, invalid_value: str) -> None:
        self.invalid_field = invalid_field
        self.invalid_value = invalid_value
        msg = f"{msg.strip()} (invalid: {invalid_field} = {invalid_value})"
        super().__init__(msg)


class DomainModel(BaseModel):
    id: UUID


class InputModel(BaseModel):
    id: Optional[UUID] = None


class PagedResultsModel(BaseModel, Generic[DomainModelT]):
    results: list[DomainModelT]
    hitCount: int
    totalHitCount: int
    page: int
    pageSize: int | None
    hasNext: bool
    hasPrev: bool

    def broadcast_transform(
        self,
        tf: Callable[[DomainModelT], DomainModelT2],
    ) -> PagedResultsModel[DomainModelT2]:
        return self.transform(lambda results: [tf(result) for result in results])

    def transform(
        self, tf: Callable[[list[DomainModelT]], list[DomainModelT2]]
    ) -> PagedResultsModel[DomainModelT2]:
        return PagedResultsModel(
            results=tf(self.results),
            hitCount=self.hitCount,
            totalHitCount=self.totalHitCount,
            page=self.page,
            pageSize=self.pageSize,
            hasNext=self.hasNext,
            hasPrev=self.hasPrev,
        )


SortDirection = Literal["asc", "desc"]
FilterOperator = Literal["=", ">", "<", ">=", "<=", "like"]


class SortModel(BaseModel):
    field: str
    direction: SortDirection = "asc"


class FilterModel(BaseModel):
    field: str
    op: FilterOperator = "="
    term: Any


class QueryModel(BaseModel):
    sorts: list[SortModel] = Field(default_factory=list)
    filters: list[FilterModel] = Field(
        default_factory=list,
        description="If you want to supply a date `term` must be in the format "
        "YYYY/MM/DD or YYYY-MM-DD",
    )
