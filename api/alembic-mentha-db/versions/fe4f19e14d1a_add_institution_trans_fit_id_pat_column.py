"""add_institution_trans_fit_id_pat_column

Revision ID: fe4f19e14d1a
Revises: 3febb33a8c51
Create Date: 2025-04-20 16:50:01.018942

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.domain.institution import INSTITUTION_TABLE


# revision identifiers, used by Alembic.
revision: str = "fe4f19e14d1a"
down_revision: Union[str, None] = "3febb33a8c51"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

column_name = "trans_fit_id_pat"


def upgrade() -> None:
    op.add_column(
        INSTITUTION_TABLE,
        column=sa.Column(
            sa.String(256),
            name=column_name,
        ),
    )


def downgrade() -> None:
    op.drop_column(INSTITUTION_TABLE, column_name)
