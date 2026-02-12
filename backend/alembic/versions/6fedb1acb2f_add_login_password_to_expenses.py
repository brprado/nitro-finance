"""add login and password to expenses

Revision ID: 6fedb1acb2f
Revises: b2c3d4e5f6a7
Create Date: 2026-02-12 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6fedb1acb2f'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('expenses', sa.Column('login', sa.String(255), nullable=True))
    op.add_column('expenses', sa.Column('password', sa.String(255), nullable=True))
    # Atualizar registros existentes com valor padrão
    op.execute("UPDATE expenses SET login = 'N/A' WHERE login IS NULL")
    op.execute("UPDATE expenses SET password = 'N/A' WHERE password IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('expenses', 'password')
    op.drop_column('expenses', 'login')
