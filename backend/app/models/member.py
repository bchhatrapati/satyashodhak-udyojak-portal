from decimal import Decimal

from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Date,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Member(Base):
    __tablename__ = "members"

    __table_args__ = (
        CheckConstraint(
            "monthly_installment_date BETWEEN 1 AND 28",
            name="check_installment_day",
        ),
        {"schema": "public"},
    )

    # Primary Key
    account_number = Column(String, primary_key=True)

    # Personal Info
    full_name = Column(Text, nullable=False)
    phone_number = Column(String(10), unique=True, nullable=False)
    email = Column(Text, nullable=False)
    date_of_birth = Column(Date, nullable=False)

    # Financials
    balance = Column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    penalty_amount = Column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))

    # Identity
    aadhar_no = Column(String(14), unique=True, nullable=False)
    pan_no = Column(String(10), unique=True)

    # Media
    photo_url = Column(Text, nullable=False)
    aadhar_url = Column(Text, nullable=False)
    pan_url = Column(Text)

    # Nominee
    nominee_name = Column(Text, nullable=False)
    nominee_relation = Column(Text, nullable=False)

    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    joining_date = Column(Date, nullable=False, server_default=func.current_date())
    monthly_installment_date = Column(Integer, nullable=False, default=10)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    transactions = relationship(
        "Transaction",
        back_populates="member",
    )

    # Optional link to Supabase Auth
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
    )
