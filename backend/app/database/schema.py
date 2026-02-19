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
    BigInteger,
    CheckConstraint
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from decimal import Decimal

Base = declarative_base()

# ============================================================
# MEMBERS TABLE
# ============================================================

class Member(Base):
    __tablename__ = "members"

    __table_args__ = (
        # Installment day validation
        CheckConstraint(
            "monthly_installment_date BETWEEN 1 AND 28",
            name="check_installment_day"
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
        onupdate=func.now()
    )

    # Relationships
    transactions = relationship(
        "Transaction",
        back_populates="member"
    )
    
    # Optional link to Supabase Auth
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )
# ============================================================
# TRANSACTIONS TABLE
# ============================================================

class Transaction(Base):
    __tablename__ = "transactions"

    __table_args__ = (
        # Balance math enforcement
        CheckConstraint(
            "(transaction_type IN ('deposit','interest','share_capital') "
            "AND new_balance = old_balance + amount) OR "
            "(transaction_type IN ('withdrawal','penalty','installment') "
            "AND new_balance = old_balance - amount)",
            name="balance_math_check"
        ),
        {"schema": "public"},
    )

    # Primary Key (identity handled by Postgres)
    id = Column(BigInteger, primary_key=True)

    receipt_no = Column(Text, unique=True, nullable=False)
    account_number = Column(
        String,
        ForeignKey("public.members.account_number"),
        nullable=False
    )

    transaction_type = Column(Text, nullable=False)
    payment_mode = Column(Text, nullable=False, default="cash")

    amount = Column(Numeric(15, 2), nullable=False)
    old_balance = Column(Numeric(15, 2), nullable=False)
    new_balance = Column(Numeric(15, 2), nullable=False)

    note = Column(Text)
    recorded_by = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    member = relationship(
        "Member",
        back_populates="transactions"
    )

# ============================================================
# ID TRACKER TABLE
# ============================================================

class IdTracker(Base):
    __tablename__ = "id_tracker"

    __table_args__ = (
        CheckConstraint("id = 1", name="only_one_row"),
        {"schema": "public"},
    )

    id = Column(Integer, primary_key=True)
    last_sequence_number = Column(Integer, nullable=False, default=10001)
    is_reverse_phase = Column(Boolean, nullable=False, default=True)
