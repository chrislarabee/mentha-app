from datetime import datetime
from uuid import uuid4

import pytest
from app.domain.transaction import (
    TransactionInput,
    decode_transaction_input_model,
    parse_transaction_fit_id,
)


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


def test_parse_transaction_fit_id():
    fit_id = "789_1011-S0200|123456"
    valid_pat = r"\d{3}_\d{4}-S0200\|(\d*)"
    assert parse_transaction_fit_id(fit_id) == fit_id
    assert parse_transaction_fit_id(fit_id, valid_pat) == "123456"
    # Sanity check to make sure patterns provided without groups just check
    # that the fit_id is in the expected pattern:
    assert parse_transaction_fit_id(fit_id, r"\d{3}_\d{4}-S0200\|\d*") == fit_id
    with pytest.raises(ValueError, match="Unexpected fit_id does not match"):
        parse_transaction_fit_id("123_1011-S0200:abc123", valid_pat)
    with pytest.raises(ValueError, match="Cannot parse fit_id with a pattern"):
        parse_transaction_fit_id(fit_id, r"\d{3}_(\d{4})-S0200\|(\d*)")
