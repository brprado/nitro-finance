from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services import expense_validation_service, alert_service
from app.models.expense_validation import ExpenseValidation, ValidationStatus
from app.models.expense import Expense, ExpenseStatus
from app.models.user import User


def check_and_create_validation_overdue_alerts() -> dict:
    """
    Verifica validações vencidas e cria alertas para os líderes.
    Executa diariamente para verificar pendências após o prazo de 3 dias.
    """
    db: Session = SessionLocal()
    try:
        # Calcular data limite (3 dias após o primeiro dia do mês atual)
        today = datetime.now().date()
        first_day_current_month = today.replace(day=1)
        deadline = first_day_current_month + timedelta(days=3)
        
        # Se ainda estamos nos primeiros 3 dias do mês, considerar o mês anterior
        if today <= deadline:
            if first_day_current_month.month == 1:
                previous_month = first_day_current_month.replace(year=first_day_current_month.year - 1, month=12)
            else:
                previous_month = first_day_current_month.replace(month=first_day_current_month.month - 1)
            deadline = previous_month + timedelta(days=3)
        
        # Buscar validações vencidas
        overdue_validations = expense_validation_service.get_overdue_validations(db, deadline)
        
        alerts_created = 0
        errors = []
        
        for validation in overdue_validations:
            try:
                # Buscar o validador (líder)
                validator = db.query(User).filter(User.id == validation.validator_id).first()
                
                if validator and validator.is_active:
                    # Verificar se já existe alerta para esta validação
                    from app.models.alert import Alert, AlertType, AlertStatus
                    existing_alert = db.query(Alert).filter(
                        Alert.validation_id == validation.id,
                        Alert.alert_type == AlertType.VALIDATION_OVERDUE,
                        Alert.status.in_([AlertStatus.PENDING, AlertStatus.SENT])
                    ).first()
                    
                    if not existing_alert:
                        alert_service.create_validation_overdue_alert(
                            db=db,
                            validation=validation,
                            recipient=validator
                        )
                        alerts_created += 1
            except Exception as e:
                errors.append(f"Erro ao criar alerta para validação {validation.id}: {str(e)}")
        
        return {
            "success": True,
            "overdue_validations_found": len(overdue_validations),
            "alerts_created": alerts_created,
            "errors": errors
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


def check_and_create_renewal_alerts(days_ahead: int = 7) -> dict:
    """
    Verifica despesas com renovação próxima e cria alertas.
    
    Args:
        days_ahead: Quantos dias antes da renovação criar o alerta (padrão: 7 dias)
    """
    db: Session = SessionLocal()
    try:
        today = datetime.now().date()
        target_date = today + timedelta(days=days_ahead)
        
        # Buscar despesas ativas com renewal_date próximo
        expenses = db.query(Expense).filter(
            Expense.status == ExpenseStatus.ACTIVE,
            Expense.renewal_date.isnot(None),
            Expense.renewal_date <= target_date,
            Expense.renewal_date >= today
        ).all()
        
        alerts_created = 0
        errors = []
        
        for expense in expenses:
            try:
                days_until = (expense.renewal_date - today).days
                
                # Verificar se já existe alerta para esta renovação
                from app.models.alert import Alert, AlertType, AlertStatus
                existing_alert = db.query(Alert).filter(
                    Alert.expense_id == expense.id,
                    Alert.alert_type.in_([AlertType.RENEWAL_UPCOMING, AlertType.RENEWAL_DUE]),
                    Alert.status.in_([AlertStatus.PENDING, AlertStatus.SENT])
                ).first()
                
                if not existing_alert:
                    if days_until == 0:
                        # Renovação hoje
                        alert_service.create_renewal_due_alert(db, expense)
                    else:
                        # Renovação em X dias
                        alert_service.create_renewal_upcoming_alert(db, expense, days_until)
                    
                    alerts_created += 1
            except Exception as e:
                errors.append(f"Erro ao criar alerta para despesa {expense.id}: {str(e)}")
        
        return {
            "success": True,
            "expenses_found": len(expenses),
            "alerts_created": alerts_created,
            "errors": errors
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()


def process_all_alerts() -> dict:
    """
    Processa todos os alertas pendentes e tenta enviá-los.
    """
    db: Session = SessionLocal()
    try:
        stats = alert_service.process_pending_alerts(db, limit=100)
        return {
            "success": True,
            **stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        db.close()
