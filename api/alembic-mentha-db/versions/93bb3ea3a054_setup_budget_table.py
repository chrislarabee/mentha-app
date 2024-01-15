"""
Initial budget table setup

Revision ID: 93bb3ea3a054
Revises: 0d96f8fad2f8
Create Date: 2023-12-20 18:19:21.305695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.budget import BUDGET_TABLE


# revision identifiers, used by Alembic.
revision: str = "93bb3ea3a054"
down_revision: Union[str, None] = "0d96f8fad2f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        BUDGET_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("category", sa.String(256)),
        sa.Column("amt", sa.Float()),
        sa.Column("period", sa.Integer),
        sa.Column("create_date", sa.Date),
        sa.Column("inactive_date", sa.Date),
        sa.Column("owner", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(BUDGET_TABLE)
