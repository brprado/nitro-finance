from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.USER
    phone: str | None = None

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: UserRole
    phone: str | None
    is_active: bool

    class Config:
        from_attributes = True