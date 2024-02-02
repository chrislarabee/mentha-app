from datetime import datetime
from pydantic import BaseModel


class NetIncomeByMonth(BaseModel):
    date: datetime
    income: float
    expense: float
    net: float
