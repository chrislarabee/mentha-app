"""
These tests exist purely to kick the tires on Pydantic validations, which can
raise runtime errors hidden from type checkers when jsons come in and out of
the API.
"""

from app.domain.account import AccountInput
from app.domain.budget import BudgetInput
from app.domain.category import CategoryInput
from app.domain.institution import InstitutionInput
from app.domain.rule import RuleInput
from app.domain.transaction import TransactionInput


def test_transaction_validation():
    assert isinstance(
        TransactionInput.model_validate(
            {
                "id": "a3427517-d9e6-49a0-8cf2-86e7fbdc7be4",
                "fitId": "123",
                "amt": 1.23,
                "type": "debit",
                "date": "2023-11-11T00:00:00.00000",
                "name": "foo",
                "category": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "account": "6baa6b73-5bb5-4c0f-991d-1c76795380d9",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
            }
        ),
        TransactionInput,
    )


def test_category_validation():
    assert isinstance(
        CategoryInput.model_validate(
            {
                "id": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "name": "foo",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
            }
        ),
        CategoryInput,
    )


def test_institution_validation():
    assert isinstance(
        InstitutionInput.model_validate(
            {
                "id": "3c4f97b0-a80d-46a4-b79c-9ee3eea67871",
                "name": "foo",
                "fitId": "1234567890",
            }
        ),
        InstitutionInput,
    )


def test_account_validation():
    assert isinstance(
        AccountInput.model_validate(
            {
                "id": "6baa6b73-5bb5-4c0f-991d-1c76795380d9",
                "fitId": "1234567890",
                "accountType": "Checking",
                "name": "foo",
                "institution": "3c4f97b0-a80d-46a4-b79c-9ee3eea67871",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
            },
        ),
        AccountInput,
    )


def test_rule_validation():
    assert isinstance(
        RuleInput.model_validate(
            {
                "id": "7dd8dafb-f8ba-4a5e-a2ca-58bb495fdf9a",
                "priority": 1,
                "resultCategory": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
                "matchName": "foo",
                "matchAmt": None,
            }
        ),
        RuleInput,
    )
    assert isinstance(
        RuleInput.model_validate(
            {
                "priority": 1,
                "resultCategory": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
                "matchName": "foo",
            }
        ),
        RuleInput,
    )


def test_budget_validation():
    assert isinstance(
        BudgetInput.model_validate(
            {
                "category": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "amt": 50,
                "period": 1,
                "createDate": "2024-01-13T11:09:06.390290",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
            }
        ),
        BudgetInput,
    )
