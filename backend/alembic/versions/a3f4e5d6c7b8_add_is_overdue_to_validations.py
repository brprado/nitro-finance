"""add is_overdue to expense_validations

Revision ID: a3f4e5d6c7b8
Revises: 6fedb1acb2f
Create Date: 2026-02-12 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a3f4e5d6c7b8'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('expense_validations', 
        sa.Column('is_overdue', sa.Boolean(), nullable=False, server_default='false'))
    op.create_index('idx_validation_overdue', 'expense_validations', ['is_overdue', 'status'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_validation_overdue', table_name='expense_validations')
    op.drop_column('expense_validations', 'is_overdue')
