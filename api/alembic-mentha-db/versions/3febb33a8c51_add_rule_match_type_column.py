"""add_rule_match_type_column

Revision ID: 3febb33a8c51
Revises: c4624a27980b
Create Date: 2025-02-17 13:27:16.755582

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.rule import RULE_TABLE


# revision identifiers, used by Alembic.
revision: str = "3febb33a8c51"
down_revision: Union[str, None] = "c4624a27980b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(RULE_TABLE, column=sa.Column(sa.String(10), name="match_type"))


def downgrade() -> None:
    op.drop_column(RULE_TABLE, "match_type")
