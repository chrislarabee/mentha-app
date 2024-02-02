from datetime import date, datetime
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter
from app.domain.trend import NetIncomeByMonth
from app.routes.utils import (
    DateQueryParam,
    date_to_datetime,
    gen_month_range,
    summarize_transactions_by_month,
)
from app.storage.db import Between, MenthaDB


class TrendRouter:
    def __init__(self, db: MenthaDB) -> None:
        self._db = db

    def create_fastapi_router(self) -> APIRouter:
        router = APIRouter(prefix="", tags=["trends"])
        router.add_api_route(
            "/net-income/{ownerId}",
            self.calculate_net_income,
            summary="Get Net Income For the Specified Period",
            description="Results will be broken down by month.",
            methods=["GET"],
        )
        return router

    async def calculate_net_income(
        self,
        ownerId: UUID,
        startDt: Annotated[date | None, DateQueryParam] = None,
        endDt: Annotated[date | None, DateQueryParam] = None,
    ) -> list[NetIncomeByMonth]:
        dt = datetime.now()
        startM, endM = gen_month_range(dt.year, dt.month)
        start = date_to_datetime(startDt) if startDt else startM
        end = date_to_datetime(endDt) if endDt else endM
        transactions = await self._db.transactions.page_through_query_async(
            owner=ownerId, date=Between(start, end)
        )
        return summarize_transactions_by_month(transactions)

    async def calculate_spending_by_category(self, ownerId: UUID) -> None:
        pass
