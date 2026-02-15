import logging
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.expense import ExpenseStatus, ExpenseType
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseWithRelationsResponse, ExpenseCancelRequest
from app.services import expense_service, expense_validation_service, exchange_service
from app.services import category_service, company_service, department_service, user_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# Apenas admins podem gerenciar todas as despesas
admin_only = require_roles([UserRole.FINANCE_ADMIN, UserRole.SYSTEM_ADMIN])


def _normalize_list(value: list | None) -> list | None:
    """Retorna None se lista vazia, senão a própria lista."""
    if value is None or len(value) == 0:
        return None
    return value


@router.get("", response_model=list[ExpenseWithRelationsResponse])
def list_expenses(
    company_ids: list[UUID] | None = Query(None, description="Filtrar por empresas"),
    department_ids: list[UUID] | None = Query(None, description="Filtrar por setores"),
    owner_ids: list[UUID] | None = Query(None, description="Filtrar por responsáveis"),
    category_ids: list[UUID] | None = Query(None, description="Filtrar por categorias"),
    status: list[ExpenseStatus] | None = Query(None, description="Filtrar por status"),
    expense_type: list[ExpenseType] | None = Query(None, description="Filtrar por tipo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista despesas com relacionamentos e filtros múltiplos (admin vê todas, líder vê dos seus setores)."""
    company_ids = _normalize_list(company_ids)
    department_ids = _normalize_list(department_ids)
    owner_ids = _normalize_list(owner_ids)
    category_ids = _normalize_list(category_ids)
    statuses = _normalize_list(status)
    expense_types = _normalize_list(expense_type)

    if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.SYSTEM_ADMIN]:
        expenses = expense_service.get_filtered(
            db,
            company_ids=company_ids,
            department_ids=department_ids,
            owner_ids=owner_ids,
            category_ids=category_ids,
            statuses=statuses,
            expense_types=expense_types,
        )
        return expenses

    if current_user.role == UserRole.LEADER:
        user_department_ids = [d.id for d in current_user.departments]
        if not user_department_ids:
            return []
        allowed_department_ids = user_department_ids
        if department_ids:
            for dept_id in department_ids:
                if dept_id not in user_department_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Você não tem acesso a este setor",
                    )
            allowed_department_ids = list(department_ids)
        expenses = expense_service.get_filtered(
            db,
            company_ids=company_ids,
            department_ids=allowed_department_ids,
            owner_ids=owner_ids,
            category_ids=category_ids,
            statuses=statuses,
            expense_types=expense_types,
        )
        return expenses

    # Usuário comum: apenas próprias despesas; ignora owner_ids do request
    expenses = expense_service.get_filtered(
        db,
        company_ids=company_ids,
        department_ids=department_ids,
        owner_ids=[current_user.id],
        category_ids=category_ids,
        statuses=statuses,
        expense_types=expense_types,
    )
    return expenses


@router.get("/{expense_id}", response_model=ExpenseWithRelationsResponse)
def get_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca despesa por ID com relacionamentos"""
    expense = expense_service.get_by_id(db, expense_id)
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada"
        )
    
    # Verifica permissão
    if current_user.role not in [UserRole.FINANCE_ADMIN, UserRole.SYSTEM_ADMIN]:
        user_department_ids = [d.id for d in current_user.departments]
        
        if current_user.role == UserRole.LEADER:
            if expense.department_id not in user_department_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não tem acesso a esta despesa"
                )
        else:
            if expense.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Você não tem acesso a esta despesa"
                )
    
    return expense


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """Cria nova despesa"""
    
    # Valida categoria
    category = category_service.get_by_id(db, data.category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria não encontrada"
        )
    
    # Valida empresa
    company = company_service.get_by_id(db, data.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa não encontrada"
        )
    
    # Valida setor
    department = department_service.get_by_id(db, data.department_id)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setor não encontrado"
        )
    
    # Valida owner
    owner = user_service.get_by_id(db, data.owner_id)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner não encontrado"
        )
    # Responsável = validador: se approver_id não vier, usa owner_id
    approver_id = data.approver_id if data.approver_id is not None else data.owner_id
    data = data.model_copy(update={"approver_id": approver_id})

    # Converte para BRL
    try:
        currency_str = data.currency.value if hasattr(data.currency, "value") else str(data.currency)
        value_brl, exchange_rate, exchange_rate_date = exchange_service.convert_to_brl(
            data.value, currency_str
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        logging.exception("Erro ao converter valor para BRL")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Erro na cotação: {e!s}"
        )

    try:
        expense = expense_service.create(
            db=db,
            data=data,
            value_brl=value_brl,
            exchange_rate=exchange_rate,
            exchange_rate_date=exchange_rate_date
        )
        expense_validation_service.create_validation_for_creation_month(db, expense)
        return expense
    except IntegrityError as e:
        logging.warning("IntegrityError ao criar despesa: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dados inválidos ou conflito (ex.: setor não pertence à empresa)."
        )
    except Exception as e:
        logging.exception("Erro ao criar despesa")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: UUID,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """Atualiza despesa"""
    expense = expense_service.get_by_id(db, expense_id)
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada"
        )
    
    # Se mudou valor ou moeda, recalcula value_brl
    value_brl = None
    exchange_rate = None
    exchange_rate_date = None
    
    if data.value is not None or data.currency is not None:
        new_value = data.value if data.value is not None else expense.value
        new_currency = data.currency if data.currency is not None else expense.currency
        
        try:
            value_brl, exchange_rate, exchange_rate_date = exchange_service.convert_to_brl(
                new_value, new_currency.value
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(e)
            )
    
    # Responsável = validador: ao alterar owner_id, forçar approver_id = owner_id
    if data.owner_id is not None:
        data = data.model_copy(update={"approver_id": data.owner_id})
    try:
        return expense_service.update(
            db=db,
            expense=expense,
            data=data,
            value_brl=value_brl,
            exchange_rate=exchange_rate,
            exchange_rate_date=exchange_rate_date
        )
    except IntegrityError as e:
        logging.warning("IntegrityError ao atualizar despesa: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dados inválidos ou conflito (ex.: setor não pertence à empresa)."
        )
    except Exception as e:
        logging.exception("Erro ao atualizar despesa")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{expense_id}/cancel", response_model=ExpenseResponse)
def cancel_expense(
    expense_id: UUID,
    body: ExpenseCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """Cancela despesa com informação se já foi processada no mês (valor conta ou não no dashboard)."""
    expense = expense_service.get_by_id(db, expense_id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada"
        )
    cancel_month = body.cancellation_month
    if cancel_month is None:
        cancel_month = date.today().replace(day=1)
    return expense_service.cancel_with_info(
        db, expense,
        charged_this_month=body.charged_this_month,
        cancellation_month=cancel_month,
    )


@router.delete("/{expense_id}", response_model=ExpenseResponse)
def delete_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    """Cancela despesa (soft delete, sem info de cobrança)"""
    expense = expense_service.get_by_id(db, expense_id)
    
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Despesa não encontrada"
        )
    
    return expense_service.delete(db, expense)