"""add code to expenses (DP01, DP02, ...)

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-02-12 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expenses', sa.Column('code', sa.String(20), nullable=True))
    conn = op.get_bind()
    result = conn.execute(sa.text('SELECT id FROM expenses ORDER BY created_at'))
    rows = result.fetchall()
    for i, (row,) in enumerate(rows, 1):
        code = f'DP{i:02d}' if i < 100 else f'DP{i}'
        conn.execute(sa.text('UPDATE expenses SET code = :code WHERE id = :id'), {'code': code, 'id': row})
    op.alter_column('expenses', 'code', existing_type=sa.String(20), nullable=False)
    op.create_index('ix_expenses_code', 'expenses', ['code'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_expenses_code', table_name='expenses')
    op.drop_column('expenses', 'code')
