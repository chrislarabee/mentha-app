from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
import re
from typing import Iterable


class UnexpectedOFXFormat(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(f"Unexpected OFX Format: {msg}")


@dataclass
class OFXTransaction:
    fit_id: str
    dt_posted: date
    trn_amt: float
    trn_type: str
    name: str
    memo: str


@dataclass
class OFXFileData:
    bank_id: str
    acct_id: str
    acct_type: str
    transactions: list[OFXTransaction]


@dataclass
class OFXTokenMatch:
    token: str
    found: str = ""


def match_ofx_tokens(raw: str, tokens: Iterable[str]) -> dict[str, str]:
    matches = {token: "" for token in tokens}

    for token in matches:
        m = re.search(rf"\<{token}\>(.*?)\<", raw)

        if m:
            matches[token] = m.groups()[0]
        else:
            raise UnexpectedOFXFormat(f"Could not find <{token}> token in {raw}.")

    return matches


def read_ofx_transaction_row(trn: str) -> OFXTransaction:
    matches = match_ofx_tokens(
        trn,
        ["FITID", "DTPOSTED", "TRNAMT", "TRNTYPE", "NAME", "MEMO"],
    )

    # All found values should be populated at this point if the transaction row
    # was in the expected format. Unexpected values should raise appropraite
    # ValueErrors:
    return OFXTransaction(
        fit_id=matches["FITID"],
        dt_posted=datetime.strptime(matches["DTPOSTED"], "%Y%m%d%H%M%S").date(),
        trn_amt=float(matches["TRNAMT"]),
        trn_type=matches["TRNTYPE"],
        name=matches["NAME"],
        memo=matches["MEMO"],
    )


def read_ofx_file(filepath: str | Path) -> OFXFileData:
    raw_header: str = ""
    raw_transactions = list[str]()
    with open(filepath) as file:
        for line in file:
            if "<STMTTRN>" in line:
                raw_transactions.append(line.strip())
            else:
                raw_header += line.strip()

    header_matches = match_ofx_tokens(raw_header, ["BANKID", "ACCTID", "ACCTTYPE"])

    return OFXFileData(
        bank_id=header_matches["BANKID"],
        acct_id=header_matches["ACCTID"],
        acct_type=header_matches["ACCTTYPE"],
        transactions=[read_ofx_transaction_row(trn) for trn in raw_transactions],
    )
