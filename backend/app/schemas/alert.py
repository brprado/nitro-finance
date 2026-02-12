from __future__ import annotations

from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.alert import AlertType, AlertStatus, AlertChannel


class AlertResponse(BaseModel):
    """Schema de resposta de alerta"""
    id: UUID
    alert_type: AlertType
    title: str
    message: str
    recipient_id: UUID
    channel: AlertChannel
    status: AlertStatus
    expense_id: UUID | None
    validation_id: UUID | None
    sent_at: datetime | None
    read_at: datetime | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class AlertWithRelationsResponse(AlertResponse):
    """Schema de resposta com relacionamentos"""
    recipient: "UserBasic"
    expense: Optional["ExpenseBasic"] = None

    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    """Schema básico de usuário"""
    id: UUID
    name: str
    email: str

    class Config:
        from_attributes = True


class ExpenseBasic(BaseModel):
    """Schema básico de despesa"""
    id: UUID
    service_name: str
    value_brl: float

    class Config:
        from_attributes = True


class AlertStatsResponse(BaseModel):
    """Schema de estatísticas de alertas"""
    total: int
    pending: int
    sent: int
    failed: int
    read: int
