"""add_complaint_id_to_indents

Revision ID: b0c41615500a
Revises: a1b2c3d4e5f6
Create Date: 2026-06-12 03:54:48.943074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0c41615500a'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('indents', sa.Column('complaint_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_indents_complaints', 'indents', 'complaints', ['complaint_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_indents_complaints', 'indents', type_='foreignkey')
    op.drop_column('indents', 'complaint_id')
