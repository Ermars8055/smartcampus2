"""update_indent_status_to_submitted

Revision ID: 726103d2516c
Revises: 103fb1416270
Create Date: 2026-08-04 11:44:27.073990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '726103d2516c'
down_revision: Union[str, None] = '103fb1416270'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE indents SET status = 'Submitted' WHERE status = 'Awaiting Approval'")

def downgrade() -> None:
    op.execute("UPDATE indents SET status = 'Awaiting Approval' WHERE status = 'Submitted'")
