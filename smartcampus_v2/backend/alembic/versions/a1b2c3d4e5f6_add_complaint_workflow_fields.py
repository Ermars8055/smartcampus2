"""add complaint workflow fields and statuses

Revision ID: a1b2c3d4e5f6
Revises: 808e8586e35b
Create Date: 2026-06-12 03:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '808e8586e35b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Status is stored as String(50), so new status values need no DDL changes.
    # Just add the new workflow columns to the complaints table.
    op.add_column('complaints', sa.Column('material_required', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('complaints', sa.Column('verified_by_id', sa.Integer(), nullable=True))
    op.add_column('complaints', sa.Column('verified_at', sa.DateTime(), nullable=True))
    op.add_column('complaints', sa.Column('rejection_remarks', sa.Text(), nullable=True))

    # Add foreign key for verified_by_id
    op.create_foreign_key(
        'fk_complaint_verified_by',
        'complaints', 'users',
        ['verified_by_id'], ['id']
    )


def downgrade() -> None:
    op.drop_constraint('fk_complaint_verified_by', 'complaints', type_='foreignkey')
    op.drop_column('complaints', 'rejection_remarks')
    op.drop_column('complaints', 'verified_at')
    op.drop_column('complaints', 'verified_by_id')
    op.drop_column('complaints', 'material_required')
