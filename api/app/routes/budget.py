from datetime import date
from uuid import UUID

from fastapi import APIRouter

from app.domain.budget import (
    UNALLOCATED_BGT,
    UNALLOCATED_CATEGORY,
    AllocatedBudget,
    Budget,
    BudgetInput,
    decode_budget_input_model,
)
from app.domain.category import Category
from app.domain.core import PagedResultsModel, QueryModel
from app.routes.router import BasicRouter
from app.routes.utils import (
    calculate_accumulated_budget,
    gen_month_range,
    page_through_query,
    get_categories_by_id,
    summarize_transactions_by_category,
)
from app.storage.db import Between, MenthaDB


class BudgetRouter(BasicRouter[Budget[UUID], BudgetInput]):
    def __init__(self, mentha_db: MenthaDB) -> None:
        super().__init__(
            singular_name="budget",
            plural_name="budgets",
            domain_model=Budget[UUID],
            input_model_decoder=decode_budget_input_model,
            table=mentha_db.budgets,
        )
        self._db = mentha_db

    def create_fastapi_router(self) -> APIRouter:
        router = super().create_fastapi_router()
        router.add_api_route(
            "/by-owner/{ownerId}/{year}/{month}",
            self.get_allocated_budgets_by_month,
            summary="Get Allocated Budgets By Year and Month",
            methods=["GET"],
        )
        return router

    async def add(self, input: BudgetInput) -> UUID:
        return await super().add(input)

    async def update(self, id: UUID, input: BudgetInput) -> Budget[UUID]:
        return await super().update(id, input)

    async def get_all(
        self, query: QueryModel, page: int = 1, pageSize: int = 50
    ) -> PagedResultsModel[Budget[UUID]]:
        return await super().get_all(query, page, pageSize)

    async def get_allocated_budgets_by_month(
        self,
        ownerId: UUID,
        year: int,
        month: int,
    ) -> list[AllocatedBudget]:
        results = list[AllocatedBudget]()
        raw_results = await page_through_query(
            self._table,
            [],
            owner=ownerId,
        )
        categories = await get_categories_by_id(
            self._db.categories, [bgt.category for bgt in raw_results]
        )
        start_m, end_m = gen_month_range(year, month)
        transactions = await page_through_query(
            self._db.transactions,
            [],
            owner=ownerId,
            date=Between(start_m, end_m),
        )
        sum_trans = summarize_transactions_by_category(transactions)
        for bgt in raw_results:
            results.append(self._transform(bgt, categories, sum_trans, start_m))
            if bgt.category in sum_trans:
                sum_trans.pop(bgt.category)
        # Any sums remaining in the summarized transactions are returned along
        # with the unallocated budget:
        remainder = sum([amt for amt in sum_trans.values()])
        unallocated_sums = remainder * -1 if remainder < 0 else remainder
        results.append(
            AllocatedBudget(
                id=UNALLOCATED_BGT,
                category=UNALLOCATED_CATEGORY,
                amt=0,
                monthAmt=0,
                accumulatedAmt=0,
                allocatedAmt=round(unallocated_sums, 2),
                period=1,
                createDate=date(year, month, 1),
                owner=ownerId,
            )
        )
        return results

    @staticmethod
    def _transform(
        bgt: Budget[UUID],
        categories: dict[UUID, Category],
        summarized_transactions: dict[UUID, float],
        to_date: date,
    ) -> AllocatedBudget:
        allocated_amt = summarized_transactions.get(bgt.category, 0)
        allocated_amt = allocated_amt * -1 if allocated_amt < 0 else allocated_amt
        amt, accumulated_amt = calculate_accumulated_budget(
            bgt.amt,
            period=bgt.period,
            create_date=bgt.createDate,
            compare_date=to_date,
        )
        return AllocatedBudget(
            id=bgt.id,
            category=categories[bgt.category],
            amt=bgt.amt,
            monthAmt=round(amt, 2),
            accumulatedAmt=round(accumulated_amt, 2),
            allocatedAmt=round(allocated_amt),
            period=bgt.period,
            createDate=bgt.createDate,
            inactiveDate=bgt.inactiveDate,
            owner=bgt.owner,
        )
