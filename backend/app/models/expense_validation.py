from sqlalchemy import Column, Enum, ForeignKey, Date, DateTime, Boolean, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base
from app.models.base import BaseModel


class ValidationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExpenseValidation(Base, BaseModel):
    __tablename__ = "expense_validations"

    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id"), nullable=False)
    validator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validation_month = Column(Date, nullable=False)  # Primeiro dia do mês validado
    status = Column(
        Enum(ValidationStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=ValidationStatus.PENDING,
    )
    validated_at = Column(DateTime(timezone=True), nullable=True)
    is_overdue = Column(Boolean, nullable=False, default=False)

    # Relacionamentos ORM
    expense = relationship("Expense", back_populates="validations")
    validator = relationship("User", foreign_keys=[validator_id])

    # Constraints
    __table_args__ = (
        UniqueConstraint('expense_id', 'validation_month', name='uq_expense_validation_month'),
        Index('idx_expense_validation_expense_month', 'expense_id', 'validation_month'),
        Index('idx_expense_validation_validator_status', 'validator_id', 'status'),
    )
