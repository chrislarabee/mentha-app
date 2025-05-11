from datetime import date
from uuid import UUID, uuid4

from fastapi import APIRouter

from app.domain.budget import (
    AllocatedBudget,
    Budget,
    BudgetInput,
    BudgetReport,
    decode_budget_input_model,
    get_anticipated_net_val,
)
from app.domain.category import INCOME, TRANSFER, UNCATEGORIZED, Category
from app.domain.core import PagedResultsModel, QueryModel
from app.routes.router import BasicRouter
from app.routes.utils import (
    calculate_accumulated_budget,
    gen_month_range,
    get_categories_by_id,
    summarize_transactions_by_category,
)
from app.storage.db import Between, MenthaDB, SimpleOp


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
    ) -> BudgetReport:
        result = BudgetReport()
        total_income_budget = 0
        total_expense_budget = 0
        actual_income = 0
        actual_expenses = 0
        anticipated_net = 0
        raw_results = await self._table.page_through_query_async(
            [],
            owner=ownerId,
        )
        categories = await get_categories_by_id(self._db.categories)
        income_cat_ids = [
            cat.id
            for cat in categories.values()
            if cat.id == INCOME.id or cat.parentCategory == INCOME.id
        ]
        start_m, end_m = gen_month_range(year, month)
        transactions = await self._db.transactions.page_through_query_async(
            [],
            owner=ownerId,
            date=Between(start_m, end_m),
            category=SimpleOp(TRANSFER.id, "!="),
        )
        sum_trans = summarize_transactions_by_category(transactions)
        for bgt in raw_results:
            tf_bgt = self._transform(bgt, categories, sum_trans, start_m)
            if tf_bgt.category.id in income_cat_ids:
                total_income_budget += tf_bgt.monthAmt
                actual_income += tf_bgt.allocatedAmt
                anticipated_net += get_anticipated_net_val(tf_bgt)
                result.income.append(tf_bgt)
            else:
                total_expense_budget += tf_bgt.monthAmt
                actual_expenses += tf_bgt.allocatedAmt
                anticipated_net -= get_anticipated_net_val(tf_bgt)
                result.budgets.append(tf_bgt)
            if bgt.category in sum_trans:
                sum_trans.pop(bgt.category)
        for cat_id, amt in sum_trans.items():
            actual_expenses += abs(amt)
            anticipated_net += amt
            result.other.append(
                AllocatedBudget(
                    id=uuid4(),
                    category=categories.get(cat_id, UNCATEGORIZED),
                    amt=0,
                    monthAmt=0,
                    accumulatedAmt=0,
                    allocatedAmt=round(abs(amt), 2),
                    period=1,
                    createDate=date(year, month, 1),
                    owner=ownerId,
                )
            )
        result.budgetedExpenses = round(total_expense_budget, 2)
        result.budgetedIncome = round(total_income_budget, 2)
        result.actualExpenses = round(actual_expenses, 2)
        result.actualIncome = round(actual_income, 2)
        result.anticipatedNet = round(anticipated_net, 2)
        result.income.sort(key=lambda bgt: bgt.category.name)
        result.budgets.sort(key=lambda bgt: bgt.category.name)
        result.other.sort(key=lambda bgt: bgt.category.name)
        return result

    @staticmethod
    def _transform(
        bgt: Budget[UUID],
        categories: dict[UUID, Category],
        summarized_transactions: dict[UUID, float],
        to_date: date,
    ) -> AllocatedBudget:
        allocated_amt = summarized_transactions.get(bgt.category, 0)
        allocated_amt = abs(allocated_amt)
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
            allocatedAmt=round(allocated_amt, 2),
            period=bgt.period,
            createDate=bgt.createDate,
            inactiveDate=bgt.inactiveDate,
            owner=bgt.owner,
        )
