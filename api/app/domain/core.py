from __future__ import annotations

from typing import Callable, Generic, Optional, TypeVar
from uuid import UUID
from pydantic import BaseModel


DomainModelT = TypeVar("DomainModelT", bound="DomainModel")
DomainModelT2 = TypeVar("DomainModelT2", bound="DomainModel")
InputModelT = TypeVar("InputModelT", bound="InputModel")
ModelT = TypeVar("ModelT", "DomainModel", "InputModel")


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
