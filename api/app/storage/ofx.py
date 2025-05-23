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


def match_ofx_date_pattern(datelike: str) -> str:
    # Treat this datestr pattern as the default since the error from strptime is
    # plenty explanatory if an alternate pattern isn't found.
    dpattern = "%Y%m%d%H%M%S"
    patterns = {r"\d{14}": dpattern, r"\d{8}": "%Y%m%d"}
    for rpat, dpat in patterns.items():
        m = re.match(rpat, datelike)
        if m:
            dpattern = dpat
            break
    return dpattern


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
    post_dt = matches["DTPOSTED"]
    dpattern = match_ofx_date_pattern(post_dt)
    # All found values should be populated at this point if the transaction row
    # was in the expected format. Unexpected values should raise appropraite
    # ValueErrors:
    return OFXTransaction(
        fit_id=matches["FITID"],
        dt_posted=datetime.strptime(post_dt, dpattern).date(),
        trn_amt=float(matches["TRNAMT"]),
        trn_type=matches["TRNTYPE"],
        name=matches["NAME"],
        memo=matches["MEMO"],
    )


def read_ofx_file(filepath: str | Path) -> OFXFileData:
    raw_header = ""
    raw_transactions = list[str]()
    accumulate = False
    trn_accumulator = ""
    with open(filepath) as file:
        for line in file:
            line = line.strip()
            if "<STMTTRN>" in line and "</STMTTRN>" in line:
                raw_transactions.append(line)
            elif line == "</STMTTRN>":
                trn_accumulator += line
                raw_transactions.append(trn_accumulator)
                trn_accumulator = ""
                accumulate = False
            elif line == "<STMTTRN>":
                accumulate = True
                trn_accumulator += line
            elif accumulate:
                trn_accumulator += line
            else:
                raw_header += line

    header_matches = match_ofx_tokens(raw_header, ["BANKID", "ACCTID", "ACCTTYPE"])

    return OFXFileData(
        bank_id=header_matches["BANKID"],
        acct_id=header_matches["ACCTID"],
        acct_type=header_matches["ACCTTYPE"],
        transactions=[read_ofx_transaction_row(trn) for trn in raw_transactions],
    )
