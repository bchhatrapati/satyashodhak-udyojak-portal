# backend/app/api/v1/endpoints/transactions.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.member import Member
from app.api.deps import get_current_user
from app.models.transaction import Transaction 
from app.schemas.transaction import TransactionResponse 

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"],
)

# ==========================================
# 1. GET ALL TRANSACTIONS (For Passbook)
# ==========================================
@router.get("/{account_number}", response_model=List[TransactionResponse])
def get_all_transactions(
    account_number: str,
    # 🛡️ ENTERPRISE FIX: Added pagination parameters with safe defaults
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
):
    """
    Fetches ALL transactions for a specific account (Newest first).
    Paginated to protect server memory.
    """
    account_number = account_number.strip()
    user_role = getattr(current_user, "role", "") or ""

    # Privacy Fence
    if user_role.upper() != "ADMIN" and current_user.account_number != account_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions",
        )

    # 🛡️ ENTERPRISE FIX: Apply offset and limit to the database query
    transactions = (
        db.query(Transaction)
        .filter(Transaction.account_number == account_number)
        .order_by(desc(Transaction.created_at)) 
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions


# ==========================================
# 2. GET LATEST TRANSACTION (For Dashboard)
# ==========================================
@router.get("/{account_number}/latest", response_model=TransactionResponse)
def get_latest_transaction(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
):
    """
    Fetches the single most recent transaction for a specific account.
    Used for quick dashboard overview.
    """
    account_number = account_number.strip()
    user_role = getattr(current_user, "role", "") or ""

    # Privacy Fence (Bank-Grade Security)
    if user_role.upper() != "ADMIN" and current_user.account_number != account_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions",
        )

    latest_tx = (
        db.query(Transaction)
        .filter(Transaction.account_number == account_number)
        .order_by(desc(Transaction.created_at)) 
        .first()
    )

    if not latest_tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No transactions found for this account",
        )

    return latest_tx