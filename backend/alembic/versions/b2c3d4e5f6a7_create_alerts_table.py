"""create alerts table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-29 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    
    # Criar enums (se não existirem)
    conn.execute(text("""
        DO $$ BEGIN
            CREATE TYPE alerttype AS ENUM ('validation_pending', 'validation_overdue', 'renewal_upcoming', 'renewal_due', 'expense_cancellation');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    conn.execute(text("""
        DO $$ BEGIN
            CREATE TYPE alertstatus AS ENUM ('pending', 'sent', 'failed', 'read');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    conn.execute(text("""
        DO $$ BEGIN
            CREATE TYPE alertchannel AS ENUM ('whatsapp', 'email', 'sms');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Verificar se tabela já existe
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'alerts'
        );
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        # Criar tabela usando SQL direto
        conn.execute(text("""
            CREATE TABLE public.alerts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                alert_type alerttype NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                recipient_id UUID NOT NULL REFERENCES public.users(id),
                channel alertchannel NOT NULL DEFAULT 'whatsapp',
                status alertstatus NOT NULL DEFAULT 'pending',
                expense_id UUID REFERENCES public.expenses(id),
                validation_id UUID REFERENCES public.expense_validations(id),
                sent_at TIMESTAMP WITH TIME ZONE,
                read_at TIMESTAMP WITH TIME ZONE,
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # Criar índices
        conn.execute(text("""
            CREATE INDEX idx_alert_recipient_status 
            ON public.alerts (recipient_id, status);
        """))
        
        conn.execute(text("""
            CREATE INDEX idx_alert_type_status 
            ON public.alerts (alert_type, status);
        """))
        
        conn.execute(text("""
            CREATE INDEX idx_alert_expense 
            ON public.alerts (expense_id);
        """))
        
        conn.commit()


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('idx_alert_expense', table_name='alerts', schema='public')
    op.drop_index('idx_alert_type_status', table_name='alerts', schema='public')
    op.drop_index('idx_alert_recipient_status', table_name='alerts', schema='public')
    op.drop_table('alerts', schema='public')
    op.execute("DROP TYPE alertchannel")
    op.execute("DROP TYPE alertstatus")
    op.execute("DROP TYPE alerttype")
