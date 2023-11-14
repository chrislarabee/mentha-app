"""
Initial transaction table setup.

Revision ID: 610a1f4d0f42
Revises:
Create Date: 2023-11-11 16:15:37.712220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.transaction import TRANSACTION_TABLE


# revision identifiers, used by Alembic.
revision: str = "610a1f4d0f42"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        TRANSACTION_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("fitid", sa.String(256)),
        sa.Column("amt", sa.Float()),
        sa.Column("date", sa.DateTime),
        sa.Column("name", sa.String(256)),
        sa.Column("category", sa.String(256)),
        sa.Column("account", sa.String(256)),
        sa.Column("owner", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(TRANSACTION_TABLE)
