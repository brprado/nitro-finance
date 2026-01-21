from app.core.database import SessionLocal
from app.services.auth_service import create_user
from app.models.user import UserRole

db = SessionLocal()

user = create_user(
    db=db,
    name="Admin Teste",
    email="admin@nitro.com",
    password="123456",
    role=UserRole.FINANCE_ADMIN,
    phone="11999999999"
)

print(f"Usuário criado: {user.id}")
exit()