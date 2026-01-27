from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.department import Department
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password


def get_all(db: Session) -> list[User]:
    """Lista todos os usuários"""
    return db.query(User).all()


def get_by_id(db: Session, user_id: UUID) -> User | None:
    """Busca usuário por ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_by_email(db: Session, email: str) -> User | None:
    """Busca usuário por email"""
    return db.query(User).filter(User.email == email).first()


def create(db: Session, data: UserCreate) -> User:
    """Cria novo usuário"""
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        phone=data.phone,
    )
    
    # Vincula aos departamentos
    if data.department_ids:
        departments = db.query(Department).filter(
            Department.id.in_(data.department_ids)
        ).all()
        user.departments = departments
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update(db: Session, user: User, data: UserUpdate) -> User:
    """Atualiza usuário existente"""
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    if data.role is not None:
        user.role = data.role
    if data.phone is not None:
        user.phone = data.phone
    if data.is_active is not None:
        user.is_active = data.is_active
    
    # Atualiza departamentos
    if data.department_ids is not None:
        departments = db.query(Department).filter(
            Department.id.in_(data.department_ids)
        ).all()
        user.departments = departments
    
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user: User) -> User:
    """Desativa usuário (soft delete)"""
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user