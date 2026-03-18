from decimal import Decimal
from typing import Optional
from datetime import datetime
from enum import Enum

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
)

# --- ENUMS ---
# These match the strict CHECK constraints in your PostgreSQL database exactly.
class TransactionType(str, Enum):
    DEPOSIT = 'deposit'
    WITHDRAWAL = 'withdrawal'
    INSTALLMENT = 'installment'
    PENALTY = 'penalty'
    INTEREST = 'interest'
    SHARE_CAPITAL = 'share_capital'

class PaymentMode(str, Enum):
    CASH = 'cash'
    ONLINE = 'online'
    TRANSFER = 'transfer'
    CHEQUE = 'cheque'


# --- 1. BASE SCHEMA ---
# Contains fields that the user will input when creating a transaction.
class TransactionBase(BaseModel):
    transaction_type: TransactionType
    payment_mode: PaymentMode = PaymentMode.CASH
    
    # Enforces the SQL check constraint (amount > 0)
    amount: Decimal = Field(..., gt=0, description="Transaction amount must be strictly greater than 0")
    
    note: Optional[str] = None


# --- 2. CREATE SCHEMA ---
# Used when the Admin submits a new transaction. 
# Notice we DO NOT ask for old_balance, new_balance, or receipt_no here.
# A secure backend calculates those internally in the service layer to prevent fraud!
class TransactionCreate(TransactionBase):
    account_number: str = Field(..., description="The SUCCS ID of the member")


# --- 3. RESPONSE SCHEMA ---
# What the Backend sends to the Next.js Frontend.
class TransactionResponse(TransactionBase):
    id: int
    receipt_no: str
    account_number: str
    
    old_balance: Decimal
    new_balance: Decimal = Field(..., ge=0) # Enforces the SQL check (new_balance >= 0)
    
    recorded_by: Optional[str] = None # The ID of the Admin who made the entry
    created_at: datetime

    # This allows Pydantic to convert SQLAlchemy rows into JSON automatically
    model_config = ConfigDict(from_attributes=True)