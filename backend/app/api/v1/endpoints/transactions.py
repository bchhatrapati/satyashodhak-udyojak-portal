# backend/app/api/v1/endpoints/transactions.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.member import Member
from app.api.deps import get_current_user
from app.models.transaction import Transaction 

# 🛡️ ENTERPRISE FIX 1: Import your Pydantic Response Schema
# Ensure you have this defined in your schemas/transaction.py file
from app.schemas.transaction import TransactionResponse 

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"],
)

# 🛡️ ENTERPRISE FIX 1: Bind the response_model to filter out sensitive DB columns
@router.get("/{account_number}/latest", response_model=TransactionResponse)
def get_latest_transaction(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
):
    """
    Fetches the single most recent transaction for a specific account.
    """
    account_number = account_number.strip()

    # 🛡️ ENTERPRISE FIX 2: Safely handle potentially missing roles
    user_role = getattr(current_user, "role", "") or ""

    # 1. Privacy Fence (Bank-Grade Security)
    if user_role.upper() != "ADMIN" and current_user.account_number != account_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions",
        )

    # 2. Query the database for the newest transaction
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