from datetime import date, datetime
from uuid import UUID, uuid4
from app.domain.category import Category, PrimaryCategory, Subcategory
from app.domain.core import FilterModel
from app.domain.transaction import Transaction, TransactionType
from app.domain.trend import CategorySpendingByMonth, NetIncomeByMonth
from app.domain.user import SYSTEM_USER
from app.routes import utils


def test_assemble_primary_categories():
    cat1 = Category(
        id=UUID("ca037de4-4594-46e4-b9d1-8f77b548eb9c"),
        name="Foo",
        owner=SYSTEM_USER.id,
    )
    cat2 = Category(
        id=UUID("3b946f97-1abd-4a89-b183-b5264b993ebc"),
        name="Bar",
        parentCategory=cat1.id,
        owner=SYSTEM_USER.id,
    )
    cat3 = Category(
        id=UUID("0ea7e8d2-af5d-40bb-9436-4398600352ec"),
        name="Spam",
        parentCategory=cat1.id,
        owner=SYSTEM_USER.id,
    )
    cat4 = Category(
        id=UUID("6ff54195-c428-4450-b3e7-b98e123dd984"),
        name="Parrot",
        owner=SYSTEM_USER.id,
    )
    cat5 = Category(
        id=UUID("65f6e23f-1895-49fd-a32f-75faaf510d2e"),
        name="Norwegian Blue",
        parentCategory=cat4.id,
        owner=SYSTEM_USER.id,
    )
    assert utils.assemble_primary_categories([cat1, cat2, cat3, cat4, cat5]) == [
        PrimaryCategory(
            id=cat1.id,
            name=cat1.name,
            owner=cat1.owner,
            subcategories=[
                Subcategory(
                    id=cat2.id,
                    name=cat2.name,
                    parentCategory=cat1.id,
                    owner=cat2.owner,
                ),
                Subcategory(
                    id=cat3.id,
                    name=cat3.name,
                    parentCategory=cat1.id,
                    owner=cat3.owner,
                ),
            ],
        ),
        PrimaryCategory(
            id=cat4.id,
            name=cat4.name,
            owner=cat4.owner,
            subcategories=[
                Subcategory(
                    id=cat5.id,
                    name=cat5.name,
                    parentCategory=cat4.id,
                    owner=cat5.owner,
                )
            ],
        ),
    ]


def test_calculate_accumulated_budget():
    assert utils.calculate_accumulated_budget(
        100, 1, date(2023, 12, 1), date(2023, 12, 21)
    ) == (100, 100)
    assert utils.calculate_accumulated_budget(
        750, 3, date(2023, 12, 1), date(2023, 12, 21)
    ) == (250, 250)
    assert utils.calculate_accumulated_budget(
        750, 3, date(2023, 11, 1), date(2023, 12, 1)
    ) == (250, 500)
    assert utils.calculate_accumulated_budget(
        750, 3, date(2023, 1, 1), date(2023, 12, 1)
    ) == (750, 750)
    assert utils.calculate_accumulated_budget(
        750, 3, date(2023, 2, 1), date(2023, 12, 1)
    ) == (250, 500)
    assert utils.calculate_accumulated_budget(
        750, 3, date(2022, 3, 1), date(2023, 12, 1)
    ) == (250, 250)
    assert utils.calculate_accumulated_budget(
        600, 6, date(2023, 1, 13), date(2023, 12, 1)
    ) == (100, 500)
    assert utils.calculate_accumulated_budget(
        120, 3, date(2024, 1, 1), date(2024, 1, 1)
    ) == (40, 40)


def test_date_to_datetime():
    assert utils.date_to_datetime(date(2023, 12, 3)) == datetime(2023, 12, 3)
    assert utils.date_to_datetime(date(2023, 12, 3), True) == datetime(
        2023, 12, 3, 23, 59, 59, 999999
    )
    assert utils.date_to_datetime(date(2023, 11, 30)) == datetime(2023, 11, 30)
    assert utils.date_to_datetime(date(2023, 11, 30), True) == datetime(
        2023, 11, 30, 23, 59, 59, 999999
    )
    assert utils.date_to_datetime(date(2023, 12, 31)) == datetime(2023, 12, 31)
    assert utils.date_to_datetime(date(2023, 12, 31), True) == datetime(
        2023, 12, 31, 23, 59, 59, 999999
    )
    assert utils.date_to_datetime(None) is None


def test_gen_dt_range():
    current = datetime.now()
    _, end_m = utils.gen_month_range(current.year, current.month)
    assert utils.gen_dt_range() == (
        datetime(current.year, current.month, 1),
        datetime(current.year, current.month, end_m.day, 23, 59, 59, 999999),
    )
    assert utils.gen_dt_range(date(2023, 10, 1)) == (
        datetime(2023, 10, 1),
        datetime(2023, 10, 31, 23, 59, 59, 999999),
    )
    assert utils.gen_dt_range(end_dt=date(2023, 10, 31)) == (
        datetime(2023, 10, 1),
        datetime(2023, 10, 31, 23, 59, 59, 999999),
    )


def test_gen_month_list():
    assert utils.gen_month_list(date(2023, 1, 1), date(2023, 5, 1)) == (
        datetime(2023, 1, 1),
        datetime(2023, 2, 1),
        datetime(2023, 3, 1),
        datetime(2023, 4, 1),
        datetime(2023, 5, 1),
    )


def test_get_next_month():
    assert utils.get_next_month(datetime(2023, 12, 4, 12, 13, 39)) == datetime(
        2024, 1, 1
    )


def test_preprocess_filters():
    raw = [
        FilterModel(field="foo", op="=", term="prueba"),
        FilterModel(field="bar", op="=", term="123"),
        FilterModel(field="spam", op="=", term="1.23"),
        FilterModel(field="eggs", op="<", term="2023-12-09"),
        FilterModel(field="eggz", op=">", term="2023/12/01"),
    ]
    assert utils.preprocess_filters(raw) == {
        "foo": FilterModel(field="foo", op="=", term="prueba"),
        "bar": FilterModel(field="bar", op="=", term=123),
        "spam": FilterModel(field="spam", op="=", term=1.23),
        "eggs": FilterModel(field="eggs", op="<", term=datetime(2023, 12, 9).date()),
        "eggz": FilterModel(field="eggz", op=">", term=datetime(2023, 12, 1).date()),
    }


def gen_test_tran(
    amt: float, cat: UUID, type: TransactionType = "debit", *, date: date | None = None
) -> Transaction[UUID]:
    return Transaction(
        id=uuid4(),
        fitId="test",
        type=type,
        amt=amt,
        date=date or datetime.now().date(),
        category=cat,
        name="foo",
        account=uuid4(),
        owner=uuid4(),
    )


def test_summarize_transactions_by_category():
    cat_a = uuid4()
    cat_b = uuid4()
    cat_c = uuid4()

    assert utils.summarize_transactions_by_category(
        [
            gen_test_tran(123.06, cat_a),
            gen_test_tran(1002.00, cat_b, "credit"),
            gen_test_tran(550, cat_b, "credit"),
            gen_test_tran(456.99, cat_a),
            gen_test_tran(67.54, cat_c),
            gen_test_tran(789.12, cat_a),
            gen_test_tran(31.08, cat_c),
        ]
    ) == {cat_a: -1369.17, cat_b: 1552.00, cat_c: -98.62}


def test_summarize_transactions_by_month():
    cat_id = uuid4()

    transactions = [
        gen_test_tran(123.45, cat_id, type="credit", date=date(2024, 1, 23)),
        gen_test_tran(400, cat_id, type="credit", date=date(2024, 2, 29)),
        gen_test_tran(320.06, cat_id, date=date(2024, 2, 13)),
        gen_test_tran(10.11, cat_id, date=date(2023, 12, 6)),
        gen_test_tran(82.28, cat_id, date=date(2023, 12, 19)),
    ]

    assert utils.summarize_transactions_by_month(
        transactions, utils.summarizer_net_income
    ) == [
        NetIncomeByMonth(
            date=datetime(2023, 12, 1), income=0, expense=-92.39, net=-92.39
        ),
        NetIncomeByMonth(
            date=datetime(2024, 1, 1), income=123.45, expense=0, net=123.45
        ),
        NetIncomeByMonth(
            date=datetime(2024, 2, 1), income=400, expense=-320.06, net=79.94
        ),
    ]

    assert utils.summarize_transactions_by_month(
        transactions, utils.summarizer_category_spending
    ) == [
        CategorySpendingByMonth(
            date=datetime(2023, 12, 1), category=cat_id, amt=-92.39
        ),
        CategorySpendingByMonth(
            date=datetime(2024, 1, 1),
            category=cat_id,
            amt=123.45,
        ),
        CategorySpendingByMonth(
            date=datetime(2024, 2, 1),
            category=cat_id,
            amt=79.94,
        ),
    ]
