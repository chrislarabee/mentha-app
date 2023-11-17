"""
These tests exist purely to kick the tires on Pydantic validations, which can
raise runtime errors hidden from type checkers when jsons come in and out of
the API.
"""

from app.domain.category import Category
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
                "category": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                "account": "6baa6b73-5bb5-4c0f-991d-1c76795380d9",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
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
                    "id": "6c47e0cc-b47c-4661-bda3-8e8077fed6c7",
                    "name": "foo",
                    "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
                },
                "account": "6baa6b73-5bb5-4c0f-991d-1c76795380d9",
                "owner": "d66d99a5-1f67-418a-bd86-ff293c632ec9",
            }
        ),
        Transaction,
    )


def test_category_validation():
    assert isinstance(
        Category.model_validate(
            {
                "id": "3c4f97b0-a80d-46a4-b79c-9ee3eea67871",
                "name": "foo",
                "owner": "7dd8dafb-f8ba-4a5e-a2ca-58bb495fdf9a",
            }
        ),
        Category,
    )
