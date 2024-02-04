from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException
from app.domain.category import Category

from app.domain.trend import CategorySpendingByMonth, NetIncomeByMonth
from app.routes.utils import (
    DateQueryParam,
    gen_dt_range,
    gen_month_list,
    summarize_transactions_by_month,
    summarizer_category_spending,
    summarizer_net_income,
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
        router.add_api_route(
            "/category-spend/{ownerId}",
            self.calculate_category_spending,
            summary="Get Category Spending For the Specified Period and Category",
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
        start, end = gen_dt_range(startDt, endDt)
        transactions = await self._db.transactions.page_through_query_async(
            owner=ownerId, date=Between(start, end)
        )
        return summarize_transactions_by_month(transactions, summarizer_net_income)

    async def calculate_category_spending(
        self,
        ownerId: UUID,
        category: UUID,
        startDt: Annotated[date | None, DateQueryParam] = None,
        endDt: Annotated[date | None, DateQueryParam] = None,
    ) -> list[CategorySpendingByMonth[Category]]:
        start, end = gen_dt_range(startDt, endDt)
        cat = await self._db.categories.get_async(category)
        if not cat:
            raise HTTPException(404, f"Category {category} not found.")
        transactions = await self._db.transactions.page_through_query_async(
            owner=ownerId, category=category, date=Between(start, end)
        )
        raw_summary = summarize_transactions_by_month(
            transactions, summarizer_category_spending
        )
        grouped_summary = {s.date: s for s in raw_summary}
        result = list[CategorySpendingByMonth[Category]]()
        for month in gen_month_list(start, end):
            summary = grouped_summary.get(
                month, CategorySpendingByMonth(date=month, category=category, amt=0)
            )
            result.append(
                CategorySpendingByMonth[Category](
                    date=summary.date, category=cat, amt=abs(summary.amt)
                )
            )
        return result
