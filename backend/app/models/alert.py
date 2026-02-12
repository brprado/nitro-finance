from sqlalchemy import Column, Enum, ForeignKey, String, Text, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base
from app.models.base import BaseModel


class AlertType(str, enum.Enum):
    VALIDATION_PENDING = "validation_pending"  # Pendência de validação
    VALIDATION_OVERDUE = "validation_overdue"  # Validação vencida
    RENEWAL_UPCOMING = "renewal_upcoming"  # Renovação próxima
    RENEWAL_DUE = "renewal_due"  # Renovação vencendo hoje
    EXPENSE_CANCELLATION = "expense_cancellation"  # Cancelamento de despesa


class AlertStatus(str, enum.Enum):
    PENDING = "pending"  # Aguardando envio
    SENT = "sent"  # Enviado com sucesso
    FAILED = "failed"  # Falha no envio
    READ = "read"  # Lido pelo usuário


class AlertChannel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"


class Alert(Base, BaseModel):
    __tablename__ = "alerts"

    # Tipo e conteúdo
    alert_type = Column(Enum(AlertType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Destinatário
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Canal e status
    channel = Column(Enum(AlertChannel), nullable=False, default=AlertChannel.EMAIL)
    status = Column(
        Enum(AlertStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AlertStatus.PENDING,
    )
    
    # Relacionamentos (opcionais - para vincular a despesa ou validação)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id"), nullable=True)
    validation_id = Column(UUID(as_uuid=True), ForeignKey("expense_validations.id"), nullable=True)
    
    # Metadados de envio
    sent_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)  # Mensagem de erro se falhar
    
    # Relacionamentos ORM
    recipient = relationship("User", foreign_keys=[recipient_id])
    expense = relationship("Expense", foreign_keys=[expense_id])
    validation = relationship("ExpenseValidation", foreign_keys=[validation_id])

    # Índices
    __table_args__ = (
        Index('idx_alert_recipient_status', 'recipient_id', 'status'),
        Index('idx_alert_type_status', 'alert_type', 'status'),
        Index('idx_alert_expense', 'expense_id'),
    )
