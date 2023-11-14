"""
Initial user table setup.

Revision ID: c20f1b59dde0
Revises: a42c1a1a0b18
Create Date: 2023-11-12 11:07:12.418145

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.user import USER_TABLE


# revision identifiers, used by Alembic.
revision: str = "c20f1b59dde0"
down_revision: Union[str, None] = "a42c1a1a0b18"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        USER_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("name", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(USER_TABLE)
