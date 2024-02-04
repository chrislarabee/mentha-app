import re
from datetime import date, datetime, timedelta
from typing import Any, Callable, Iterable, Optional, TypeVar, cast, overload
from uuid import UUID

from dateutil.relativedelta import relativedelta
from fastapi import Query

from app.domain.category import (
    SYSTEM_CATEGORIES,
    Category,
    PrimaryCategory,
    Subcategory,
)
from app.domain.core import FilterModel
from app.domain.transaction import Transaction
from app.domain.trend import CategorySpendingByMonth, NetIncomeByMonth, TrendByMonth
from app.storage.db import IsIn, MenthaTable

TrendByMonthT = TypeVar("TrendByMonthT", bound=TrendByMonth)
CategoryT = TypeVar("CategoryT", UUID, Category)

DateQueryParam = Query(description="Date in YYYY-MM-DD format.")


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


@overload
def date_to_datetime(dt: date, ceil_time: bool = False) -> datetime: ...
@overload
def date_to_datetime(dt: None, ceil_time: bool = False) -> None: ...


def date_to_datetime(dt: date | None, ceil_time: bool = False) -> datetime | None:
    """
    Simple date to datetime conversion.

    Args:
        dt (date | None): The date object.
        ceil_time (bool, optional): If True, will return a datetime object with the
            time portion set to just before midnight. Defaults to False.

    Returns:
        datetime | None: A datetime object with the passed date's info.
    """
    if dt:
        result = datetime(dt.year, dt.month, dt.day)
        if ceil_time:
            result = result + timedelta(days=1) - timedelta(microseconds=1)
        return result


def gen_dt_range(
    start_dt: Optional[date] = None, end_dt: Optional[date] = None
) -> tuple[datetime, datetime]:
    """
    Generates a datetime range.

    If start_dt is None, the beginning of the range will be the beginning of the
    month supplied in end_dt.

    If end_dt is None, the end of the range will be the end of the month supplied in
    start_dt (including a time portion just before midnight).

    If both are None, then it will supply a datetime range for the current month.

    Args:
        start_dt (Optional[date], optional): Defaults to None.
        end_dt (Optional[date], optional): Defaults to None.

    Returns:
        tuple[datetime, datetime]: The resulting datetime range.
    """
    dt = datetime.now()
    if start_dt and end_dt:
        start = date_to_datetime(start_dt)
        end = date_to_datetime(end_dt, ceil_time=True)
    elif start_dt and not end_dt:
        start, end = gen_month_range(start_dt.year, start_dt.month)
    elif end_dt and not start_dt:
        start, end = gen_month_range(end_dt.year, end_dt.month)
    else:
        start, end = gen_month_range(dt.year, dt.month)
    return start, end


def gen_month_list(start_dt: date, end_dt: date) -> tuple[datetime, ...]:
    """
    Generates a tuple of datetime objects, each being the first day of the month for
    all months within the specified range (inclusive of provided bounds).  All of the
    objects will have their timestamps set to midnight (00:00:00.000).

    Args:
        start_dt (date): Desired start of the range.
        end_dt (date): Desired end of the range.

    Returns:
        tuple[datetime, ...]: The tuple of generated datetime objects.
    """
    start, end = gen_dt_range(start_dt, end_dt)
    result = list[datetime]()
    month = datetime(start.year, start.month, 1)
    while True:
        result.append(month)
        if month.year == end.year and month.month == end.month:
            break
        month = get_next_month(month)
    return tuple(result)


def gen_month_range(year: int, month: int) -> tuple[datetime, datetime]:
    """
    Args:
        year (int): The year of the month to generate a range for.
        month (int): The month to generate a range for.

    Returns:
        tuple[datetime, datetime]: The first and last days of the requested
        month. Last day will have the timestamp 23:59:59.999999
    """
    month_start = datetime(year, month, 1)
    month_end = get_next_month(month_start)
    month_end = month_end - timedelta(microseconds=1)
    return month_start, month_end


async def get_categories_by_id(
    category_table: MenthaTable[Category], ids: Iterable[UUID] | None = None
) -> dict[UUID, Category]:
    kwargs = dict[str, Any]()
    if ids:
        kwargs = {"id": IsIn([id for id in ids])}
    cat_result = await category_table.page_through_query_async([], **kwargs)
    return {cat.id: cat for cat in [*cat_result, *SYSTEM_CATEGORIES]}


def get_next_month(dt: datetime) -> datetime:
    """
    Args:
        dt (datetime): The datetime object to get the next month after.

    Returns:
        datetime: A datetime object set to the first day of the month after the
        provided datetime object (timestamp 00:00:00.000)
    """
    dt = datetime(dt.year, dt.month, 1)
    if dt.month == 12:
        result = datetime(dt.year + 1, 1, 1)
    else:
        result = datetime(dt.year, dt.month + 1, 1)
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


def summarizer_category_spending(
    month: datetime, trans: Iterable[Transaction[CategoryT]]
) -> CategorySpendingByMonth[CategoryT]:
    cat_ids = set[UUID]()
    categories = list[CategoryT]()
    for t in trans:
        if isinstance(t.category, Category):
            cat_ids.add(t.category.id)
        else:
            cat_ids.add(t.category)
        categories.append(t.category)
    if len(cat_ids) > 1:
        raise ValueError(
            "Cannot summarize transactions of heterogenous categories"
            f" by a single category. Number of categories found = {len(cat_ids)}"
        )
    return CategorySpendingByMonth(
        date=month,
        category=categories[0],
        amt=round(sum([tran.amt for tran in trans]), 2),
    )


def summarizer_net_income(
    month: datetime, trans: Iterable[Transaction[CategoryT]]
) -> NetIncomeByMonth:
    return NetIncomeByMonth(
        date=month,
        income=round(sum([tran.amt for tran in trans if tran.amt >= 0]), 2),
        expense=round(sum([tran.amt for tran in trans if tran.amt < 0]), 2),
        net=round(sum([tran.amt for tran in trans]), 2),
    )


def summarize_transactions_by_category(
    transactions: Iterable[Transaction[Any]],
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


def summarize_transactions_by_month(
    transactions: Iterable[Transaction[CategoryT]],
    summarizer: Callable[[datetime, Iterable[Transaction[CategoryT]]], TrendByMonthT],
) -> list[TrendByMonthT]:
    groups = dict[datetime, list[Transaction[Any]]]()
    result = list[TrendByMonthT]()
    for tran in transactions:
        month = datetime(tran.date.year, tran.date.month, 1)
        if month not in groups:
            groups[month] = []
        groups[month].append(tran)
    for month, trans in groups.items():
        result.append(summarizer(month, trans))
    result.sort(key=lambda nibm: nibm.date)
    return result
