"""add transaction type column

Revision ID: c4624a27980b
Revises: 93bb3ea3a054
Create Date: 2025-02-17 11:09:01.946033

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.transaction import TRANSACTION_TABLE


# revision identifiers, used by Alembic.
revision: str = "c4624a27980b"
down_revision: Union[str, None] = "93bb3ea3a054"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(TRANSACTION_TABLE, column=sa.Column(sa.String(10), name="type"))


def downgrade() -> None:
    op.drop_column(TRANSACTION_TABLE, column_name="type")
