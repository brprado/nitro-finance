from uuid import UUID
from datetime import datetime, timezone, timedelta, date
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.alert import Alert, AlertType, AlertStatus, AlertChannel
from app.models.user import User
from app.models.expense import Expense, ExpenseStatus
from app.models.expense_validation import ExpenseValidation, ValidationStatus


def create_alert(
    db: Session,
    alert_type: AlertType,
    title: str,
    message: str,
    recipient_id: UUID,
    expense_id: Optional[UUID] = None,
    validation_id: Optional[UUID] = None,
    channel: AlertChannel = AlertChannel.EMAIL  # Canal padrão (envio externo desabilitado; alertas apenas in-app)
) -> Alert:
    """
    Cria um novo alerta no sistema.
    Alertas são exibidos no app; envio externo (WhatsApp, etc.) foi desabilitado.
    """
    alert = Alert(
        alert_type=alert_type,
        title=title,
        message=message,
        recipient_id=recipient_id,
        expense_id=expense_id,
        validation_id=validation_id,
        channel=channel,
        status=AlertStatus.PENDING
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return alert


def send_alert(db: Session, alert_id: UUID) -> Alert:
    """
    Marca o alerta como enviado (disponível no app).
    Envio externo (WhatsApp, email, SMS) foi desabilitado; alertas são apenas in-app.
    """
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise ValueError("Alerta não encontrado")
    
    if alert.status != AlertStatus.PENDING:
        raise ValueError(f"Alerta já foi processado. Status atual: {alert.status.value}")
    
    recipient = db.query(User).filter(User.id == alert.recipient_id).first()
    
    if not recipient or not recipient.is_active:
        alert.status = AlertStatus.FAILED
        alert.error_message = "Destinatário não encontrado ou inativo"
        alert.updated_at = datetime.now(timezone.utc)
        db.commit()
        return alert
    
    # Alertas apenas in-app (sem envio externo)
    alert.status = AlertStatus.SENT
    alert.sent_at = datetime.now(timezone.utc)
    alert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    
    return alert


def create_and_send_alert(
    db: Session,
    alert_type: AlertType,
    title: str,
    message: str,
    recipient_id: UUID,
    expense_id: Optional[UUID] = None,
    validation_id: Optional[UUID] = None,
    channel: AlertChannel = AlertChannel.EMAIL,
    send_immediately: bool = True
) -> Alert:
    """
    Cria e opcionalmente envia um alerta.
    """
    alert = create_alert(
        db=db,
        alert_type=alert_type,
        title=title,
        message=message,
        recipient_id=recipient_id,
        expense_id=expense_id,
        validation_id=validation_id,
        channel=channel
    )
    
    if send_immediately:
        try:
            alert = send_alert(db, alert.id)
        except Exception as e:
            # Log do erro mas não falha a criação do alerta
            alert.error_message = str(e)
            db.commit()
    
    return alert


def get_pending_alerts(db: Session, limit: int = 100) -> list[Alert]:
    """Lista alertas pendentes de envio"""
    return db.query(Alert).filter(
        Alert.status == AlertStatus.PENDING
    ).order_by(Alert.created_at.asc()).limit(limit).all()


def get_alerts_by_recipient(
    db: Session, 
    recipient_id: UUID, 
    status: Optional[AlertStatus] = None,
    limit: int = 50
) -> list[Alert]:
    """Lista alertas de um destinatário"""
    query = db.query(Alert).filter(Alert.recipient_id == recipient_id)
    
    if status:
        query = query.filter(Alert.status == status)
    
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


def mark_as_read(db: Session, alert_id: UUID) -> Alert:
    """Marca alerta como lido"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise ValueError("Alerta não encontrado")
    
    alert.status = AlertStatus.READ
    alert.read_at = datetime.now(timezone.utc)
    alert.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(alert)
    
    return alert


def create_validation_overdue_alert(
    db: Session,
    validation: ExpenseValidation,
    recipient: User
) -> Alert:
    """
    Cria alerta de validação vencida.
    """
    expense = db.query(Expense).filter(Expense.id == validation.expense_id).first()
    
    if not expense:
        raise ValueError("Despesa não encontrada")
    
    title = "Validação de Despesa Vencida"
    message = (
        f"⚠️ *Validação Vencida*\n\n"
        f"Olá {recipient.name},\n\n"
        f"A validação da despesa *{expense.service_name}* está vencida.\n"
        f"Por favor, acesse o sistema para validar.\n\n"
        f"Valor: R$ {expense.value_brl:.2f}\n"
        f"Setor: {expense.department.name if expense.department else 'N/A'}\n"
        f"Mês de referência: {validation.validation_month.strftime('%m/%Y')}"
    )
    
    return create_and_send_alert(
        db=db,
        alert_type=AlertType.VALIDATION_OVERDUE,
        title=title,
        message=message,
        recipient_id=recipient.id,
        validation_id=validation.id,
        expense_id=expense.id
    )


def create_renewal_upcoming_alert(
    db: Session,
    expense: Expense,
    days_until_renewal: int
) -> Alert:
    """
    Cria alerta de renovação próxima.
    """
    recipient = db.query(User).filter(User.id == expense.owner_id).first()
    
    if not recipient:
        raise ValueError("Responsável da despesa não encontrado")
    
    title = f"Renovação em {days_until_renewal} dias"
    message = (
        f"📅 *Renovação Próxima*\n\n"
        f"Olá {recipient.name},\n\n"
        f"A despesa *{expense.service_name}* será renovada em *{days_until_renewal} dias*.\n\n"
        f"Valor: R$ {expense.value_brl:.2f}\n"
        f"Data de renovação: {expense.renewal_date.strftime('%d/%m/%Y') if expense.renewal_date else 'N/A'}\n"
        f"Plano: {expense.contracted_plan or 'N/A'}"
    )
    
    return create_and_send_alert(
        db=db,
        alert_type=AlertType.RENEWAL_UPCOMING,
        title=title,
        message=message,
        recipient_id=recipient.id,
        expense_id=expense.id
    )


def create_renewal_due_alert(
    db: Session,
    expense: Expense
) -> Alert:
    """
    Cria alerta de renovação vencendo hoje.
    """
    recipient = db.query(User).filter(User.id == expense.owner_id).first()
    
    if not recipient:
        raise ValueError("Responsável da despesa não encontrado")
    
    title = "Renovação Hoje"
    message = (
        f"🔔 *Renovação Hoje*\n\n"
        f"Olá {recipient.name},\n\n"
        f"A despesa *{expense.service_name}* será renovada *HOJE*.\n\n"
        f"Valor: R$ {expense.value_brl:.2f}\n"
        f"Plano: {expense.contracted_plan or 'N/A'}\n\n"
        f"Por favor, verifique se a renovação está correta."
    )
    
    return create_and_send_alert(
        db=db,
        alert_type=AlertType.RENEWAL_DUE,
        title=title,
        message=message,
        recipient_id=recipient.id,
        expense_id=expense.id
    )


def process_pending_alerts(db: Session, limit: int = 50) -> dict:
    """
    Processa alertas pendentes e tenta enviá-los.
    Retorna estatísticas do processamento.
    """
    pending_alerts = get_pending_alerts(db, limit)
    
    stats = {
        "processed": 0,
        "sent": 0,
        "failed": 0
    }
    
    for alert in pending_alerts:
        try:
            result = send_alert(db, alert.id)
            stats["processed"] += 1
            
            if result.status == AlertStatus.SENT:
                stats["sent"] += 1
            else:
                stats["failed"] += 1
        except Exception as e:
            stats["failed"] += 1
            # Atualizar alerta com erro
            alert.status = AlertStatus.FAILED
            alert.error_message = str(e)
            alert.updated_at = datetime.now(timezone.utc)
            db.commit()
    
    return stats
