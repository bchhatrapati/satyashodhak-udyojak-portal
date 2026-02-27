import uuid
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select

from app.models.transaction import Transaction
from app.models.member import Member
from app.repositories.member_repo import MemberRepository


class TransactionService:
    """
    Central Accounting Engine of the Patsanstha.

    Guarantees:
    - Row-level locking
    - Atomic balance update
    - Ledger & balance always synchronized
    - Controlled payment modes
    """

    ALLOWED_PAYMENT_MODES = {"cash", "online", "transfer", "cheque"}

    # ----------------------------------
    # DASHBOARD
    # ----------------------------------

    @staticmethod
    def get_dashboard_stats(db: Session):
        return MemberRepository.get_stats(db)

    # ----------------------------------
    # INTERNAL UTILITIES
    # ----------------------------------

    @staticmethod
    def _to_decimal(amount) -> Decimal:
        """
        Convert to 2-decimal Decimal safely.
        Prevents float precision errors.
        """
        return Decimal(str(amount)).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )

    @staticmethod
    def _generate_receipt_no(tx_type: str) -> str:
        """
        Generates unique receipt number.
        Example: RCPT-SHA-AB12CD34
        """
        unique_id = uuid.uuid4().hex[:8].upper()
        return f"RCPT-{tx_type[:3].upper()}-{unique_id}"

    # ----------------------------------
    # MASTER TRANSACTION ENGINE
    # ----------------------------------

    @staticmethod
    def _execute(
        db: Session,
        account_number: str,
        amount,
        tx_type: str,
        is_credit: bool,
        note: str,
        payment_mode: str = "cash",
        recorded_by: Optional[str] = "SYSTEM",
        auto_commit: bool = True,
    ) -> Transaction:

        # Validate payment mode
        if payment_mode not in TransactionService.ALLOWED_PAYMENT_MODES:
            raise ValueError("Invalid payment mode")

        # Convert amount safely
        amount = TransactionService._to_decimal(amount)

        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        # 🔒 Row-level lock
        member = db.execute(
            select(Member)
            .where(Member.account_number == account_number)
            .with_for_update()
        ).scalar_one_or_none()

        if not member:
            raise ValueError("Member not found")

        old_balance = TransactionService._to_decimal(member.balance)

        # Calculate new balance
        if is_credit:
            new_balance = old_balance + amount
        else:
            if old_balance < amount:
                raise ValueError("Insufficient balance")
            new_balance = old_balance - amount

        new_balance = TransactionService._to_decimal(new_balance)

        try:
            txn = Transaction(
                receipt_no=TransactionService._generate_receipt_no(tx_type),
                account_number=account_number,
                transaction_type=tx_type,
                payment_mode=payment_mode,
                amount=amount,
                old_balance=old_balance,
                new_balance=new_balance,
                note=note,
                recorded_by=recorded_by,
            )

            db.add(txn)

            # Update balance
            member.balance = new_balance

            if auto_commit:
                db.commit()
                db.refresh(txn)
            else:
                db.flush()

            return txn

        except SQLAlchemyError as e:
            if auto_commit:
                db.rollback()
            raise e

    # ----------------------------------
    # DOMAIN METHODS
    # ----------------------------------

    @staticmethod
    def record_monthly_share(
        db: Session,
        account_number: str,
        amount,
        payment_mode: str = "cash",
        recorded_by: Optional[str] = "SYSTEM",
        auto_commit: bool = True,
    ):
        """CREDIT → Monthly Share Capital"""
        return TransactionService._execute(
            db=db,
            account_number=account_number,
            amount=amount,
            tx_type="share_capital",
            is_credit=True,
            note="Monthly Share Capital Contribution",
            payment_mode=payment_mode,
            recorded_by=recorded_by,
            auto_commit=auto_commit,
        )

    @staticmethod
    def record_withdrawal(
        db: Session,
        account_number: str,
        amount,
        payment_mode: str = "cash",
        recorded_by: Optional[str] = "SYSTEM",
        auto_commit: bool = True,
    ):
        """DEBIT → Savings Withdrawal"""
        return TransactionService._execute(
            db=db,
            account_number=account_number,
            amount=amount,
            tx_type="withdrawal",
            is_credit=False,
            note="Member Savings Withdrawal",
            payment_mode=payment_mode,
            recorded_by=recorded_by,
            auto_commit=auto_commit,
        )

    @staticmethod
    def record_loan_installment(
        db: Session,
        account_number: str,
        amount,
        payment_mode: str = "cash",
        recorded_by: Optional[str] = "SYSTEM",
        auto_commit: bool = True,
    ):
        """DEBIT → Loan EMI Payment"""
        return TransactionService._execute(
            db=db,
            account_number=account_number,
            amount=amount,
            tx_type="installment",
            is_credit=False,
            note="Loan EMI Payment",
            payment_mode=payment_mode,
            recorded_by=recorded_by,
            auto_commit=auto_commit,
        )
