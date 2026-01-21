from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel
from app.models.user_department import user_departments


class Department(Base, BaseModel):
    __tablename__ = "departments"

    name = Column(String(255), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relacionamentos
    company = relationship("Company", back_populates="departments")
    users = relationship(
        "User",
        secondary=user_departments,
        back_populates="departments",
    )