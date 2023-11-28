"""
Initial account table setup.

Revision ID: 268ac3d0dc3f
Revises: c20f1b59dde0
Create Date: 2023-11-20 21:13:31.076503

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.account import ACCOUNT_TABLE


# revision identifiers, used by Alembic.
revision: str = "268ac3d0dc3f"
down_revision: Union[str, None] = "c20f1b59dde0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        ACCOUNT_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("fit_id", sa.String(256)),
        sa.Column("account_type", sa.String(100)),
        sa.Column("name", sa.String(256)),
        sa.Column("institution", sa.String(256)),
        sa.Column("owner", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(ACCOUNT_TABLE)
