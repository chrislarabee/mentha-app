import re
from datetime import date, datetime, timedelta
from typing import Any, Iterable, cast
from uuid import UUID

from dateutil.relativedelta import relativedelta

from app.domain.category import (
    SYSTEM_CATEGORIES,
    Category,
    PrimaryCategory,
    Subcategory,
)
from app.domain.core import DomainModelT, FilterModel, SortModel
from app.domain.transaction import Transaction
from app.storage.db import IsIn, MenthaTable


def assemble_primary_categories(raw: list[Category]) -> list[PrimaryCategory]:
    primaries = list[Category]()
    subcategories = dict[UUID, list[Subcategory]]()

    for cat in raw:
        parent_uuid = cat.parentCategory
        if parent_uuid:
            if parent_uuid not in subcategories:
                subcategories[parent_uuid] = []
            subcategories[parent_uuid].append(
                Subcategory(
                    id=cat.id,
                    name=cat.name,
                    parentCategory=parent_uuid,
                    owner=cat.owner,
                )
            )
        else:
            primaries.append(cat)

    return [
        PrimaryCategory(
            id=cat.id,
            name=cat.name,
            owner=cat.owner,
            subcategories=subcategories.get(cat.id, []),
        )
        for cat in primaries
    ]


def gen_month_range(year: int, month: int) -> tuple[datetime, datetime]:
    if month == 12:
        month_end = datetime(year + 1, 1, 1)
    else:
        month_end = datetime(year, month + 1, 1)
    month_end = month_end - timedelta(microseconds=1)
    return datetime(year, month, 1), month_end


async def get_categories_by_id(
    category_table: MenthaTable[Category], ids: Iterable[UUID] | None = None
) -> dict[UUID, Category]:
    kwargs = dict[str, Any]()
    if ids:
        kwargs = {"id": IsIn([id for id in ids])}
    cat_result = await page_through_query(category_table, [], **kwargs)
    return {cat.id: cat for cat in [*cat_result, *SYSTEM_CATEGORIES]}


def calculate_accumulated_budget(
    base_amt: float, period: int, create_date: date, compare_date: date
) -> tuple[float, float]:
    """
    Calculates the budgeted amount and amount accumulated to date for a Budget.

    Args:
        base_amt (float): The amount specified in the Budget.
        period (int): The Budget's period.
        create_date (date): The Budget's createDate.
        compare_date (date): The date to compare against the Budget's createDate.
        Often the current date.

    Returns:
        tuple[float, float]: The budget amount for the "current" month, as well
        as the amount that has been accumulated to the budget up to the month
        specified by the compare_date
    """
    if period == 1:
        this_month = base_amt
        total = base_amt
    else:
        this_month = base_amt / period
        month_diff = relativedelta(compare_date, create_date).months
        total_periods = (month_diff % period) if month_diff > period else month_diff
        total = this_month * (total_periods + 1)
        if total == base_amt:
            this_month = total
    return this_month, total


async def page_through_query(
    table: MenthaTable[DomainModelT],
    sorts: list[SortModel] | None = None,
    **kwargs: Any,
) -> list[DomainModelT]:
    page = 1
    result = list[DomainModelT]()
    while True:
        results = await table.query_async(
            page=page,
            page_size=100,
            sorts=sorts or [],
            **kwargs,
        )
        result += results.results
        if not results.hasNext:
            break
        else:
            page += 1
    return result


def preprocess_filters(filters: list[FilterModel]) -> dict[str, FilterModel]:
    result = dict[str, FilterModel]()
    for f in filters:
        term = f.term
        if isinstance(term, str):
            datematch = re.match(r"(\d{4})[-/](\d{2})[-/](\d{2})", term)
            isfloat = False
            try:
                float(term)
            except ValueError:
                pass
            else:
                isfloat = True
            if isfloat:
                f.term = float(term)
            elif term.isnumeric():
                f.term = int(term)
            elif datematch:
                yyyy, mm, dd = datematch.groups()
                f.term = datetime.strptime(f"{yyyy}-{mm}-{dd}", "%Y-%m-%d").date()
        result[f.field] = f
    return result


def summarize_transactions_by_category(
    transactions: list[Transaction[Any]],
) -> dict[UUID, float]:
    groups = dict[UUID, list[Transaction[Any]]]()
    for tran in transactions:
        if isinstance(tran.category, Category):
            cat_id = tran.category.id
        else:
            cat_id = cast(UUID, tran.category)
        if cat_id not in groups:
            groups[cat_id] = []
        groups[cat_id].append(tran)
    return {k: sum([tran.amt for tran in v]) for k, v in groups.items()}
