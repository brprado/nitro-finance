import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services import alert_service
from app.models.alert import Alert, AlertType, AlertStatus
from app.models.expense import Expense, ExpenseStatus
from app.models.expense_validation import ExpenseValidation, ValidationStatus
from app.models.user import User

logger = logging.getLogger(__name__)

RENEWAL_ALERT_DAYS = [7, 3, 1]


def _has_approved_validation(db: Session, expense_id, renewal_date) -> bool:
    """Verifica se existe validação aprovada para a despesa no mês da renovação."""
    validation_month = renewal_date.replace(day=1)
    return db.query(ExpenseValidation).filter(
        ExpenseValidation.expense_id == expense_id,
        ExpenseValidation.status == ValidationStatus.APPROVED,
        ExpenseValidation.validation_month == validation_month,
    ).first() is not None


def _alert_already_exists(db: Session, expense_id, days_until: int) -> bool:
    """Verifica se já existe alerta para essa despesa com esse número de dias."""
    title_pattern = f"Renovação em {days_until} dia"
    return db.query(Alert).filter(
        Alert.expense_id == expense_id,
        Alert.alert_type == AlertType.RENEWAL_UPCOMING,
        Alert.title.ilike(f"%{title_pattern}%"),
        Alert.status.in_([AlertStatus.PENDING, AlertStatus.SENT]),
    ).first() is not None


def check_and_create_renewal_alerts_7_3_1() -> dict:
    """
    Verifica despesas ativas com renewal_date nos próximos 7 dias
    e cria alertas para 7, 3 e 1 dia antes da renovação.

    - O alerta é enviado ao owner (responsável) da despesa.
    - Se a despesa já possui validação aprovada para o mês da renovação,
      nenhum alerta é criado.
    - Alertas duplicados (mesmo expense + mesmo nº de dias) são ignorados.
    """
    db: Session = SessionLocal()
    try:
        today = datetime.now().date()
        max_ahead = today + timedelta(days=max(RENEWAL_ALERT_DAYS))

        expenses = db.query(Expense).filter(
            Expense.status == ExpenseStatus.ACTIVE,
            Expense.renewal_date.isnot(None),
            Expense.renewal_date >= today,
            Expense.renewal_date <= max_ahead,
        ).all()

        alerts_created = 0
        skipped_validated = 0
        skipped_duplicate = 0
        errors = []

        for expense in expenses:
            days_until = (expense.renewal_date - today).days

            if days_until not in RENEWAL_ALERT_DAYS:
                continue

            try:
                if _has_approved_validation(db, expense.id, expense.renewal_date):
                    skipped_validated += 1
                    continue

                if _alert_already_exists(db, expense.id, days_until):
                    skipped_duplicate += 1
                    continue

                alert_service.create_renewal_upcoming_alert(db, expense, days_until)
                alerts_created += 1
                logger.info(
                    "Alerta de renovação criado: %s em %d dia(s) para owner %s",
                    expense.service_name, days_until, expense.owner_id,
                )
            except Exception as e:
                errors.append(f"Erro despesa {expense.id}: {e}")
                logger.exception("Erro ao criar alerta para despesa %s", expense.id)

        result = {
            "success": True,
            "expenses_checked": len(expenses),
            "alerts_created": alerts_created,
            "skipped_validated": skipped_validated,
            "skipped_duplicate": skipped_duplicate,
            "errors": errors,
        }
        logger.info("Verificação de renovação concluída: %s", result)
        return result
    except Exception as e:
        logger.exception("Erro na verificação de renovação")
        return {"success": False, "error": str(e)}
    finally:
        db.close()


def check_and_create_renewal_alerts(days_ahead: int = 7) -> dict:
    """Wrapper mantido para compatibilidade com endpoint existente."""
    return check_and_create_renewal_alerts_7_3_1()


def process_all_alerts() -> dict:
    """Processa todos os alertas pendentes."""
    db: Session = SessionLocal()
    try:
        stats = alert_service.process_pending_alerts(db, limit=100)
        return {"success": True, **stats}
    except Exception as e:
        logger.exception("Erro ao processar alertas")
        return {"success": False, "error": str(e)}
    finally:
        db.close()
