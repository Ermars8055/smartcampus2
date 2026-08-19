"""add_create_po_to_equipment_actions

Revision ID: 66ed97e88599
Revises: eef19244a3af
Create Date: 2026-08-19 20:08:34.769916

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66ed97e88599'
down_revision: Union[str, None] = 'eef19244a3af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        UPDATE menu_items 
        SET extended_actions = '[{"key": "create_po", "label": "Create PO", "color": "#10B981"}]'::json 
        WHERE resource = 'equipment';
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE menu_items 
        SET extended_actions = '[]'::json 
        WHERE resource = 'equipment';
    """)
