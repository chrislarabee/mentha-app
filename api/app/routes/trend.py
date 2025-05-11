from datetime import date
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from app.domain.category import SYSTEM_CATEGORIES_BY_ID, TRANSFER, Category

from app.domain.trend import CategorySpendingByMonth, NetIncomeByMonth
from app.routes.utils import (
    DateQueryParam,
    gen_dt_range,
    summarize_transactions_by_month,
    summarizer_category_spending,
    summarizer_net_income,
)
from app.storage.db import Between, MenthaDB, SimpleOp


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
            owner=ownerId,
            date=Between(start, end),
            category=SimpleOp(TRANSFER.id, "!="),
        )
        return summarize_transactions_by_month(transactions, summarizer_net_income)

    async def calculate_category_spending(
        self,
        ownerId: UUID,
        category: UUID,
        startDt: Annotated[date | None, DateQueryParam] = None,
        endDt: Annotated[date | None, DateQueryParam] = None,
    ) -> list[CategorySpendingByMonth[Category]]:
        if category in SYSTEM_CATEGORIES_BY_ID:
            cat = SYSTEM_CATEGORIES_BY_ID[category]
        else:
            cat = await self._db.categories.get_async(category)
            if not cat:
                raise HTTPException(404, f"Category {category} not found.")
        query_args = dict[str, Any](owner=ownerId, category=category)
        if startDt and endDt:
            query_args["date"] = Between(startDt, endDt)
        transactions = await self._db.transactions.page_through_query_async(
            sorts=None, **query_args
        )
        raw_summary = summarize_transactions_by_month(
            transactions, summarizer_category_spending
        )
        result = list[CategorySpendingByMonth[Category]]()
        for summary in raw_summary:
            result.append(
                CategorySpendingByMonth[Category](
                    date=summary.date, category=cat, amt=abs(summary.amt)
                )
            )
        return result
