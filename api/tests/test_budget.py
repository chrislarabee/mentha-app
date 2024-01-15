from datetime import date, datetime
from uuid import uuid4
from app.domain.budget import BudgetInput, decode_budget_input_model


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
