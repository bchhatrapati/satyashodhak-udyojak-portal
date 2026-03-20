# backend/app/api/v1/endpoints/transactions.py

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database.session import get_db
from app.models.member import Member
from app.api.deps import get_current_user, require_admin
from app.models.transaction import Transaction 
from app.schemas.transaction import TransactionResponse, TransactionCreate 

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"],
)

# ==========================================
# 🚀 1. CREATE TRANSACTION (ADMIN ONLY)
# POST /api/v1/transactions/
# ==========================================
@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_admin: Member = Depends(require_admin), # 🛡️ Hard lock: Admins only
):
    """
    Core Financial Engine:
    Processes a new transaction, updates the member's balance, and generates a receipt.
    """
    account_number = data.account_number.strip().upper()
    
    # 1. Fetch the Member and LOCK the row for update (Bank-Grade Concurrency Safety)
    member = (
        db.query(Member)
        .filter(Member.account_number == account_number)
        .with_for_update() 
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_number} not found"
        )
        
    if not getattr(member, "is_active", True):
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot process transactions. Account {account_number} is inactive."
        )

    # 2. Strict Financial Math Logic (Using Decimal)
    tx_type = data.transaction_type.value if hasattr(data.transaction_type, 'value') else str(data.transaction_type)
    is_credit = tx_type.lower() in ["deposit", "share_capital", "interest"]
    
    # 🛡️ EXPLICIT `is not None` CHECK: Prevents a legitimate 0.00 balance from evaluating as False
    current_balance = Decimal(str(member.balance)) if member.balance is not None else Decimal('0.00')
    tx_amount = Decimal(str(data.amount))
    
    # Calculate new balance
    if is_credit:
        new_balance = current_balance + tx_amount
    else:
        new_balance = current_balance - tx_amount
        # Overdraft Protection
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient funds. Current balance is ₹{current_balance}"
            )

    # 3. Generate Receipt Number (Format: REC-YYYYMMDD-HHMMSS)
    timestamp_str = datetime.now().strftime("%Y%m%d-%H%M%S")
    auto_receipt = f"REC-{timestamp_str}"

    try:
        # 4. Create the Transaction Record
        new_tx = Transaction(
            account_number=account_number,
            transaction_type=tx_type,
            payment_mode=data.payment_mode.value if hasattr(data.payment_mode, 'value') else str(data.payment_mode),
            amount=tx_amount, 
            receipt_no=auto_receipt,
            note=data.note,  
            old_balance=current_balance, 
            new_balance=new_balance,
            recorded_by=current_admin.account_number # Audit trail
        )
        
        # 5. Update the Member's Master Balance
        member.balance = new_balance
        
        # 6. Commit Both Changes Together (Atomic Transaction)
        db.add(new_tx)
        db.commit()
        db.refresh(new_tx)
        
        return new_tx

    except Exception as e:
        db.rollback() 
        print(f"CRITICAL DB ERROR during transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to commit transaction to database."
        )


# ==========================================
# 🌐 2. GET GLOBAL LEDGER (ADMIN ONLY)
# GET /api/v1/transactions/
# ==========================================
@router.get("/", response_model=List[TransactionResponse])
def get_global_ledger(
    search: Optional[str] = Query(None, description="Search by account number or receipt"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=500, description="Max number of records to return"),
    db: Session = Depends(get_db),
    current_admin: Member = Depends(require_admin), 
):
    """
    Enterprise Global Ledger:
    Fetches all transactions across the entire cooperative society.
    """
    query = db.query(Transaction)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.account_number.ilike(search_term),
                Transaction.receipt_no.ilike(search_term)
            )
        )

    transactions = (
        query.order_by(desc(Transaction.created_at)) 
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions


# ==========================================
# 3. GET LATEST PAID SHARE (For Dashboard)
# GET /api/v1/transactions/{account_number}/latest
# 🛡️ ENTERPRISE FIX: Moved ABOVE the wildcard route!
# ==========================================
@router.get("/{account_number}/latest", response_model=TransactionResponse)
def get_latest_transaction(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
):
    """
    Fetches the single most recent CREDIT transaction.
    Used for the dashboard 'Last Paid Share' card.
    """
    account_number = account_number.strip()
    user_role = getattr(current_user, "role", "") or ""

    if user_role.upper() != "ADMIN" and current_user.account_number != account_number:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these transactions",
        )

    # 🛡️ Using your exact logic
    valid_credit_types = ["deposit", "share_capital"] # Add "interest" here if needed

    latest_tx = (
        db.query(Transaction)
        .filter(
            Transaction.account_number == account_number,
            Transaction.transaction_type.in_(valid_credit_types) 
        )
        .order_by(desc(Transaction.created_at)) 
        .first()
    )

    if not latest_tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No paid shares found for this account",
        )

    return latest_tx


# ==========================================
# 4. GET ALL TRANSACTIONS (For Passbook)
# GET /api/v1/transactions/{account_number}
# 🛡️ Must be at the BOTTOM so the wildcard doesn't swallow other routes
# ==========================================
@router.get("/{account_number}", response_model=List[TransactionResponse])
def get_all_transactions(
    account_number: str,
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

    transactions = (
        db.query(Transaction)
        .filter(Transaction.account_number == account_number)
        .order_by(desc(Transaction.created_at)) 
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions
