"""
Initial institution table setup.

Revision ID: a18c8679d98e
Revises: 268ac3d0dc3f
Create Date: 2023-11-20 21:13:45.096472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.institution import INSTITUTION_TABLE


# revision identifiers, used by Alembic.
revision: str = "a18c8679d98e"
down_revision: Union[str, None] = "268ac3d0dc3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        INSTITUTION_TABLE,
        sa.Column("id", sa.String(256)),
        sa.Column("name", sa.String(256)),
        sa.Column("fit_id", sa.String(256)),
    )


def downgrade() -> None:
    op.drop_table(INSTITUTION_TABLE)
