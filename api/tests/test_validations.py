"""
These tests exist purely to kick the tires on Pydantic validations, which can
raise runtime errors hidden from type checkers when jsons come in and out of
the API.
"""

from app.domain.category import DEFAULT_CATEGORY_ID, Category
from app.domain.transaction import Transaction


def test_transaction_validation():
    assert isinstance(
        Transaction.model_validate(
            {
                "id": "a3427517-d9e6-49a0-8cf2-86e7fbdc7be4",
                "fitid": "123",
                "amt": 1.23,
                "date": "2023-11-11T14:57:10.941509",
                "name": "foo",
                "category": DEFAULT_CATEGORY_ID.hex,
            }
        ),
        Transaction,
    )
    assert isinstance(
        Transaction.model_validate(
            {
                "id": "a3427517-d9e6-49a0-8cf2-86e7fbdc7be4",
                "fitid": "123",
                "amt": 1.23,
                "date": "2023-11-11T14:57:10.941509",
                "name": "foo",
                "category": {
                    "id": DEFAULT_CATEGORY_ID.hex,
                    "name": "foo",
                },
            }
        ),
        Transaction,
    )


def test_category_validation():
    assert isinstance(
        Category.model_validate(
            {"id": "3c4f97b0-a80d-46a4-b79c-9ee3eea67871", "name": "foo"}
        ),
        Category,
    )
