from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    Text,
    BigInteger,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    __table_args__ = (
        CheckConstraint(
            "(transaction_type IN ('deposit','interest','share_capital') "
            "AND new_balance = old_balance + amount) OR "
            "(transaction_type IN ('withdrawal','penalty','installment') "
            "AND new_balance = old_balance - amount)",
            name="balance_math_check",
        ),
        {"schema": "public"},
    )

    # Primary Key (identity handled by Postgres)
    id = Column(BigInteger, primary_key=True)

    receipt_no = Column(Text, unique=True, nullable=False)
    account_number = Column(
        String,
        ForeignKey("public.members.account_number"),
        nullable=False,
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
        back_populates="transactions",
    )
