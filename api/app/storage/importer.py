from pathlib import Path
from typing import Iterable
from uuid import UUID, uuid4

from app.domain.account import Account, AccountType
from app.domain.category import UNCATEGORIZED
from app.domain.rule import Rule, check_rule_against_transaction
from app.domain.transaction import Transaction
from app.storage.db import MenthaDB
from app.storage.ofx import OFXFileData, OFXTransaction, read_ofx_file

IMPORT_FILES = Path("imports/")
INBOX = IMPORT_FILES.joinpath("inbox")
COMPLETE = IMPORT_FILES.joinpath("complete")


class TransactionImporterError(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(msg)


class Importer:
    def __init__(
        self,
        for_owner: UUID,
        db: MenthaDB,
    ) -> None:
        self._owner = for_owner
        self._db = db
        self._rules = list[Rule[UUID]]()
        INBOX.mkdir(exist_ok=True)
        COMPLETE.mkdir(exist_ok=True)

    async def refresh_rules(self) -> None:
        q_result = await self._db.rules.query_async(owner=self._owner)
        self._rules = q_result.results
        self._rules.sort(key=lambda rule: rule.priority)

    async def execute(self) -> None:
        imported = list[Path]()
        for filepath in INBOX.iterdir():
            ofx_file = read_ofx_file(filepath)
            inst_result = await self._db.institutions.query_async(
                fit_id=ofx_file.bank_id
            )
            insts = inst_result.results
            # This is done first because there is no guarantee that two given
            # financial institutions will have universally unique account ids.
            if len(insts) == 0:
                # Currently only importing transactions from known institutions:
                raise TransactionImporterError(
                    f"Unable to locate institution for fit_id {ofx_file.bank_id}"
                )
            else:
                inst = insts[0]
            acct_result = await self._db.accounts.query_async(
                fit_id=ofx_file.acct_id, institution=inst.id
            )
            accts = acct_result.results
            if len(accts) == 0:
                acct = self.create_acct_from_ofx_file(ofx_file, self._owner, inst.id)
                await self._db.accounts.insert_async(acct)
            else:
                acct = accts[0]
            transactions = await self.check_rules_against_ofx_transactions(
                ofx_file.transactions, self._rules, acct.id, self._owner
            )
            await self._db.transactions.insert_async(*transactions)
            imported.append(filepath)
        for filepath in imported:
            filepath.rename(COMPLETE.joinpath(filepath.name))

    @classmethod
    async def check_rules_against_ofx_transactions(
        cls,
        ofxtrns: Iterable[OFXTransaction],
        rules: list[Rule[UUID]],
        acct_id: UUID,
        owner_id: UUID,
    ) -> list[Transaction[UUID]]:
        results = list[Transaction[UUID]]()
        for transaction in ofxtrns:
            tran = cls.decode_ofx_transaction_to_domain(
                transaction,
                acct_id,
                owner_id,
            )
            for rule in rules:
                check = check_rule_against_transaction(rule, tran)
                if check:
                    tran.category = check
                    break
            results.append(tran)
        return results

    @staticmethod
    def decode_ofx_transaction_to_domain(
        ofxtrn: OFXTransaction, acct_id: UUID, owner_id: UUID
    ) -> Transaction[UUID]:
        return Transaction(
            id=uuid4(),
            fitId=ofxtrn.fit_id,
            # Not currently making amt negative for debit trn_types as all
            # current import files already use that convention. Worth revisiting
            # if files with different conventions are ever imported.
            amt=ofxtrn.trn_amt,
            date=ofxtrn.dt_posted,
            name=ofxtrn.name,
            category=UNCATEGORIZED.id,
            account=acct_id,
            owner=owner_id,
        )

    @staticmethod
    def create_acct_from_ofx_file(
        ofx_file: OFXFileData, owner_id: UUID, inst_id: UUID
    ) -> Account[UUID]:
        # Augment this logic as needed:
        acct_type: AccountType = (
            "Savings" if ofx_file.acct_type == "SAVINGS" else "Checking"
        )
        return Account(
            id=uuid4(),
            fitId=ofx_file.acct_id,
            accountType=acct_type,
            name=ofx_file.acct_type,
            institution=inst_id,
            owner=owner_id,
        )
