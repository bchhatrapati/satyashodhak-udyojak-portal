from decimal import Decimal
from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

# --- 1. ENUMS (The Rules) ---
class TransactionType(str, Enum):
    """Strictly allowed transaction types"""
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    INSTALLMENT = "installment"
    PENALTY = "penalty"
    INTEREST = "interest"
    SHARE_CAPITAL = "share_capital"

class PaymentMode(str, Enum):
    """Strictly allowed payment methods"""
    CASH = "cash"
    ONLINE = "online"
    TRANSFER = "transfer"
    CHEQUE = "cheque"

# --- 2. CREATE SCHEMA ---
class TransactionCreate(BaseModel):
    """What the Admin sends to record a new entry"""
    account_number: str
    transaction_type: TransactionType
    payment_mode: PaymentMode = PaymentMode.CASH
    amount: Decimal = Field(..., gt=0, description="Amount must be positive")
    note: Optional[str] = Field(None, max_length=255)
    recorded_by: str  # Admin username or ID

# --- 3. RESPONSE SCHEMA ---
class TransactionResponse(BaseModel):
    """What the Dashboard shows in the Passbook"""
    id: int
    receipt_no: str
    account_number: str
    transaction_type: TransactionType
    payment_mode: PaymentMode
    
    amount: Decimal
    old_balance: Decimal
    new_balance: Decimal
    
    note: Optional[str]
    recorded_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)