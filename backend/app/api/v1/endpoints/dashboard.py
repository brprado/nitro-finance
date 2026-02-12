from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.alert import Alert, AlertStatus
from app.models.expense_validation import ExpenseValidation, ValidationStatus
from app.models.expense import Expense
from app.services import dashboard_service
from app.schemas.dashboard import (
    DashboardStatsResponse,
    CategoryExpenseResponse,
    CompanyExpenseResponse,
    DepartmentExpenseResponse,
    TimelineDataResponse,
    TopExpenseResponse,
    StatusDistributionResponse,
    UpcomingRenewalsResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna estatísticas gerais do dashboard"""
    stats = dashboard_service.get_dashboard_stats(db, current_user, company_id, department_id, month)
    
    # Calcular validações pendentes
    if current_user.role.value in ['finance_admin', 'system_admin']:
        pending_validations = db.query(func.count(ExpenseValidation.id)).filter(
            ExpenseValidation.status == ValidationStatus.PENDING
        ).scalar() or 0
    else:
        # Líder vê apenas suas pendências
        user_department_ids = [d.id for d in current_user.departments]
        if user_department_ids:
            from app.models.expense import Expense
            pending_validations = db.query(func.count(ExpenseValidation.id)).join(
                Expense, ExpenseValidation.expense_id == Expense.id
            ).filter(
                and_(
                    ExpenseValidation.status == ValidationStatus.PENDING,
                    Expense.department_id.in_(user_department_ids)
                )
            ).scalar() or 0
        else:
            pending_validations = 0
    
    # Calcular alertas não lidos
    unread_alerts = db.query(func.count(Alert.id)).filter(
        and_(
            Alert.recipient_id == current_user.id,
            Alert.status == AlertStatus.PENDING
        )
    ).scalar() or 0
    
    # Atualizar stats com valores calculados
    stats.pending_validations = pending_validations
    stats.unread_alerts = unread_alerts
    
    return stats


@router.get("/expenses-by-category", response_model=CategoryExpenseResponse)
def get_expenses_by_category(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    limit: int = Query(10, le=50, description="Limite de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna agregação de despesas por categoria"""
    return dashboard_service.get_expenses_by_category(
        db, current_user, company_id, department_id, limit, month
    )


@router.get("/expenses-by-company", response_model=CompanyExpenseResponse)
def get_expenses_by_company(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    limit: int = Query(10, le=50, description="Limite de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna agregação de despesas por empresa"""
    return dashboard_service.get_expenses_by_company(
        db, current_user, company_id, department_id, limit, month
    )


@router.get("/expenses-by-department", response_model=DepartmentExpenseResponse)
def get_expenses_by_department(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    limit: int = Query(10, le=50, description="Limite de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna agregação de despesas por setor"""
    return dashboard_service.get_expenses_by_department(
        db, current_user, company_id, department_id, limit, month
    )


@router.get("/expenses-timeline", response_model=TimelineDataResponse)
def get_expenses_timeline(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    months: int = Query(6, ge=1, le=12, description="Número de meses"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna dados de evolução de gastos ao longo do tempo"""
    return dashboard_service.get_expenses_timeline(
        db, current_user, company_id, department_id, months
    )


@router.get("/top-expenses", response_model=TopExpenseResponse)
def get_top_expenses(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    limit: int = Query(10, ge=1, le=50, description="Limite de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna as maiores despesas"""
    return dashboard_service.get_top_expenses(
        db, current_user, company_id, department_id, limit, month
    )


@router.get("/expenses-by-status", response_model=StatusDistributionResponse)
def get_expenses_by_status(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    month: str | None = Query(None, description="Filtrar por mês (formato YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna distribuição de despesas por status"""
    return dashboard_service.get_expenses_by_status(
        db, current_user, company_id, department_id, month
    )


@router.get("/upcoming-renewals", response_model=UpcomingRenewalsResponse)
def get_upcoming_renewals(
    company_id: UUID | None = Query(None, description="Filtrar por empresa"),
    department_id: UUID | None = Query(None, description="Filtrar por setor"),
    days: int = Query(30, ge=1, le=90, description="Dias à frente para buscar"),
    limit: int = Query(10, ge=1, le=50, description="Limite de resultados"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna próximas renovações"""
    return dashboard_service.get_upcoming_renewals(
        db, current_user, company_id, department_id, days, limit
    )
