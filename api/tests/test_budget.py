from datetime import date, datetime
from uuid import uuid4
from app.domain.budget import (
    AllocatedBudget,
    BudgetInput,
    decode_budget_input_model,
    get_anticipated_net_val,
)
from app.domain.category import Category


def test_decode_budget_input_model():
    dt = datetime.now()
    budget_input = BudgetInput(
        id=None,
        category=uuid4(),
        amt=500,
        period=1,
        createDate=dt,
        owner=uuid4(),
    )
    result = decode_budget_input_model(uuid4(), budget_input)
    assert result.createDate == date(dt.year, dt.month, 1)


def test_get_anticipated_net_val():
    budget = AllocatedBudget(
        id=uuid4(),
        category=Category(id=uuid4(), name="test", owner=uuid4()),
        amt=50,
        monthAmt=50,
        accumulatedAmt=50,
        allocatedAmt=53,
        period=1,
        createDate=datetime.now().date(),
        owner=uuid4(),
    )
    assert get_anticipated_net_val(budget) == 53
    budget.allocatedAmt = 45
    assert get_anticipated_net_val(budget) == 50
    budget.allocatedAmt = 0
    budget.amt = 300
    budget.period = 6
    assert get_anticipated_net_val(budget) == 50
    budget.allocatedAmt = 320
    assert get_anticipated_net_val(budget) == 70
