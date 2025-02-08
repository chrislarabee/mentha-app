from datetime import date

import pytest
from app.storage.ofx import (
    OFXFileData,
    OFXTransaction,
    UnexpectedOFXFormat,
    match_ofx_tokens,
    read_ofx_file,
    read_ofx_transaction_row,
)


def test_match_ofx_tokens():
    expected = {
        "FITID": "789_1011-S0200|123456",
        "DTPOSTED": "20230828123115",
        "TRNAMT": "-1.00",
        "TRNTYPE": "DEBIT",
        "NAME": "Foo",
        "MEMO": "DebitCard, Withdrawal, Processed",
    }
    assert (
        match_ofx_tokens(
            "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20230828123115<TRNAMT>-1.00"
            "<FITID>789_1011-S0200|123456<NAME>Foo"
            "<MEMO>DebitCard, Withdrawal, Processed</STMTTRN>",
            ["FITID", "DTPOSTED", "TRNAMT", "TRNTYPE", "NAME", "MEMO"],
        )
        == expected
    )

    with pytest.raises(
        UnexpectedOFXFormat, match="Unexpected OFX Format: Could not find <TRNAMT>"
    ):
        read_ofx_transaction_row(
            "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20230828123115<AMT>-1.00"
            "<FITID>789_1011-S0200|123456<NAME>Foo"
            "<MEMO>DebitCard, Withdrawal, Processed</STMTTRN>"
        )


def test_read_ofx_transaction_row():
    assert read_ofx_transaction_row(
        "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20230828123115<TRNAMT>-1.00"
        "<FITID>789_1011-S0200|123456<NAME>Foo"
        "<MEMO>DebitCard, Withdrawal, Processed</STMTTRN>",
    ) == OFXTransaction(
        fit_id="789_1011-S0200|123456",
        dt_posted=date(2023, 8, 28),
        trn_amt=-1.00,
        trn_type="DEBIT",
        name="Foo",
        memo="DebitCard, Withdrawal, Processed",
    )

    with pytest.raises(ValueError, match="could not convert string to float: '1.oo'"):
        read_ofx_transaction_row(
            "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20230828123115<TRNAMT>1.oo"
            "<FITID>789_1011-S0200|123456<NAME>Foo"
            "<MEMO>DebitCard, Withdrawal, Processed</STMTTRN>"
        )


def test_read_ofx_file():
    expected = OFXFileData(
        bank_id="123456",
        acct_id="123_456-S0200",
        acct_type="CHECKING",
        transactions=[
            OFXTransaction(
                fit_id="789_1011-S0200|123456",
                dt_posted=date(2023, 8, 28),
                trn_amt=-1.00,
                trn_type="DEBIT",
                name="Foo",
                memo="DebitCard, Withdrawal, Processed",
            ),
            OFXTransaction(
                fit_id="789_1011-S0200|123457",
                dt_posted=date(2023, 8, 28),
                trn_amt=-37.36,
                trn_type="DEBIT",
                name="Bar",
                memo="DebitCard, Withdrawal, Processed",
            ),
            OFXTransaction(
                fit_id="789_1011-S0200|123458",
                dt_posted=date(2023, 8, 29),
                trn_amt=-3.00,
                trn_type="DEBIT",
                name="Spam",
                memo="DebitCard, Withdrawal, Processed",
            ),
            OFXTransaction(
                fit_id="789_1011-S0200|123459",
                dt_posted=date(2023, 8, 30),
                trn_amt=-18.33,
                trn_type="PAYMENT",
                name="Eggs",
                memo="BillPayment, Withdrawal, Processed",
            ),
            OFXTransaction(
                fit_id="789_1011-S0200|123460",
                dt_posted=date(2023, 8, 31),
                trn_amt=208.58,
                trn_type="DIRECTDEP",
                name="Python",
                memo="ACH, Deposit, Processed",
            ),
        ],
    )
    assert read_ofx_file("tests/samples/acct_trns.ofx") == expected
    assert read_ofx_file("tests/samples/acct_trns_newlines.ofx") == expected
