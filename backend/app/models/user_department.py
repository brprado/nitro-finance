from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

user_departments = Table(
    "user_departments",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("department_id", UUID(as_uuid=True), ForeignKey("departments.id"), primary_key=True),
)