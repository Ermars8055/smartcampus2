"""Merge heads

Revision ID: 053e1276c903
Revises: 3e9d57e7c260, 83daf2f6102d
Create Date: 2026-08-11 12:30:47.986241

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '053e1276c903'
down_revision: Union[str, None] = ('3e9d57e7c260', '83daf2f6102d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
