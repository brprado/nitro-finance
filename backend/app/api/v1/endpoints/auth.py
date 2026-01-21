from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth import LoginRequest, Token
from app.services.auth_service import authenticate_user, create_token_for_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):

    user = authenticate_user(db, request.email, request.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = create_token_for_user(user)

    return Token(access_token=token)

