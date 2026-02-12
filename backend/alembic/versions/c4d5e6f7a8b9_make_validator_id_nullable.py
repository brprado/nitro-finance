"""make validator_id nullable in expense_validations

Revision ID: c4d5e6f7a8b9
Revises: a3f4e5d6c7b8
Create Date: 2026-02-12 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = '6fedb1acb2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Tornar validator_id nullable
    op.alter_column('expense_validations', 'validator_id',
                    existing_type=sa.UUID(),
                    nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Tornar validator_id NOT NULL novamente
    # Nota: Isso pode falhar se houver registros com validator_id NULL
    op.alter_column('expense_validations', 'validator_id',
                    existing_type=sa.UUID(),
                    nullable=False)
