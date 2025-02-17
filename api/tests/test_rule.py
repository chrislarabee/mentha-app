from datetime import datetime
from uuid import uuid4

import pytest
from app.domain.category import UNCATEGORIZED
from app.domain.core import DataIntegrityError
from app.domain.rule import (
    Rule,
    RuleInput,
    check_rule_against_transaction,
    decode_rule_input_model,
)
from app.domain.transaction import Transaction


def test_decode_rule_input_model():
    rule_input = RuleInput(
        id=None,
        priority=1,
        resultCategory=uuid4(),
        owner=uuid4(),
        matchName=None,
        matchAmt="blar",
    )
    with pytest.raises(DataIntegrityError, match="matchAmt must be in the format"):
        decode_rule_input_model(uuid4(), rule_input)
    rule_input.matchAmt = "=1.23"
    assert decode_rule_input_model(uuid4(), rule_input)
    rule_input.matchAmt = ">=123"
    assert decode_rule_input_model(uuid4(), rule_input)
    rule_input.matchAmt = "-123"
    assert decode_rule_input_model(uuid4(), rule_input)


def test_check_rule_against_transaction():
    cat_id = uuid4()
    rule = Rule(
        id=uuid4(),
        priority=1,
        resultCategory=cat_id,
        owner=uuid4(),
        matchName=".*foo.*",
        matchAmt=None,
    )
    transaction = Transaction(
        id=uuid4(),
        fitId="prueba",
        amt=12.05,
        type="debit",
        date=datetime.now().date(),
        name="foo restaurant",
        category=UNCATEGORIZED.id,
        account=uuid4(),
        owner=uuid4(),
    )
    assert check_rule_against_transaction(rule, transaction) == cat_id
    rule.matchName = None
    rule.matchAmt = "12.05"
    assert check_rule_against_transaction(rule, transaction) == cat_id
    rule.matchAmt = ">0"
    assert check_rule_against_transaction(rule, transaction) == cat_id
    rule.matchAmt = "<0"
    assert check_rule_against_transaction(rule, transaction) is None
    rule.matchAmt = ">=12.01"
    assert check_rule_against_transaction(rule, transaction) == cat_id
    rule.matchAmt = ">=12.1"
    assert check_rule_against_transaction(rule, transaction) is None
    rule.matchName = ".*foo.*"
    rule.matchAmt = ">0"
    assert check_rule_against_transaction(rule, transaction) == cat_id
    rule.matchAmt = "<0"
    assert check_rule_against_transaction(rule, transaction) is None
