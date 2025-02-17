from datetime import datetime
from uuid import uuid4
from app.domain.transaction import TransactionInput, decode_transaction_input_model


def test_decode_transaction_input_model():
    tran_input = TransactionInput(
        id=None,
        fitId="test",
        amt=-123.45,
        type="debit",
        date=datetime.now(),
        name="test",
        category=uuid4(),
        owner=uuid4(),
        account=uuid4(),
    )
    result = decode_transaction_input_model(uuid4(), tran_input)
    assert result.amt == 123.45
    tran_input.type = "credit"
    result = decode_transaction_input_model(uuid4(), tran_input)
    assert result.amt == 123.45
