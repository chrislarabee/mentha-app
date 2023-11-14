"""
Initial category table setup.

Revision ID: a42c1a1a0b18
Revises: 610a1f4d0f42
Create Date: 2023-11-11 16:32:03.744500

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.category import CATEGORY_TABLE, DEFAULT_CATEGORY_ID
from app.domain.user import SYSTEM_USER


# revision identifiers, used by Alembic.
revision: str = "a42c1a1a0b18"
down_revision: Union[str, None] = "610a1f4d0f42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    categories = op.create_table(
        CATEGORY_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("name", sa.String(256)),
        sa.Column("parent_category", sa.String(256)),
        sa.Column("owner", sa.String(256)),
    )
    op.bulk_insert(  # type: ignore
        categories,
        [
            {
                "id": DEFAULT_CATEGORY_ID,
                "name": "Uncategorized",
                "parent_category": None,
                "owner": SYSTEM_USER.id,
            }
        ],
    )


def downgrade() -> None:
    op.drop_table(CATEGORY_TABLE)
