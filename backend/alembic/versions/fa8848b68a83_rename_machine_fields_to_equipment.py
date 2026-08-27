"""rename machine fields to equipment

Revision ID: fa8848b68a83
Revises: 7140bef92def
Create Date: 2026-08-26 14:23:02.239653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa8848b68a83'
down_revision: Union[str, None] = '7140bef92def'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('equipment_items', 'machine_type', new_column_name='equipment_category')
    op.alter_column('equipment_items', 'machine_cost', new_column_name='equipment_cost')


def downgrade() -> None:
    op.alter_column('equipment_items', 'equipment_category', new_column_name='machine_type')
    op.alter_column('equipment_items', 'equipment_cost', new_column_name='machine_cost')
