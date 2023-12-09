"""setup_rule_table

Revision ID: 0d96f8fad2f8
Revises: a18c8679d98e
Create Date: 2023-11-28 16:37:06.014822

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.rule import RULE_TABLE


# revision identifiers, used by Alembic.
revision: str = "0d96f8fad2f8"
down_revision: Union[str, None] = "a18c8679d98e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        RULE_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("priority", sa.Integer),
        sa.Column("result_category", sa.String(256)),
        sa.Column("owner", sa.String(256)),
        sa.Column("match_name", sa.String(256)),
        sa.Column("match_amt", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(RULE_TABLE)
