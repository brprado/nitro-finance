from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    if not user.is_active:
        return None
    
    return user

def create_token_for_user(user: User) -> str:
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    }
    return create_access_token(token_data)

def create_user(db: Session, name: str, email: str, password: str, role: str, phone: str | None = None) -> User:
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        phone=phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user