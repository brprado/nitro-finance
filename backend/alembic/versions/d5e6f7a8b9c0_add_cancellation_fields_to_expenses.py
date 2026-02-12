"""add cancellation_month and charged_when_cancelled to expenses

Revision ID: d5e6f7a8b9c0
Revises: a3f4e5d6c7b8
Create Date: 2026-02-12 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'a3f4e5d6c7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('cancellation_month', sa.Date(), nullable=True))
    op.add_column('expenses', sa.Column('charged_when_cancelled', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('expenses', 'charged_when_cancelled')
    op.drop_column('expenses', 'cancellation_month')
