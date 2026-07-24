"""add department to users

Revision ID: ec0e29710c92
Revises: 05ed00d63012
Create Date: 2026-06-01 10:53:49.937933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec0e29710c92'
down_revision: Union[str, None] = '05ed00d63012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('department', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'department')
