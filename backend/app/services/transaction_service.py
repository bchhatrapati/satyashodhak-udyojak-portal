import uuid
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select

from app.database.schema import Transaction, Member
from app.repositories.members_repo import MemberRepository


class TransactionService:
    """
    Central Accounting Engine of the Patsanstha.
    Ensures member balance and ledger remain synchronized.
    """

    ALLOWED_PAYMENT_MODES = {"cash", "online", "transfer", "cheque"}

    @staticmethod
    def get_dashboard_stats(db: Session):
        return MemberRepository.get_stats(db)

    # -----------------------------
    # INTERNAL UTILS
    # -----------------------------

    @staticmethod
    def _to_decimal(amount) -> Decimal:
        return Decimal(str(amount))

    @staticmethod
    def _generate_receipt_no(tx_type: str) -> str:
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"RCPT-{tx_type[:3].upper()}-{unique_id}"

    # -----------------------------
    # MASTER TRANSACTION PROCESSOR
    # -----------------------------

    @staticmethod
    def _execute(
        db: Session,
        account_number: str,
        amount: Decimal,
        tx_type: str,
        is_credit: bool,
        note: str,
        payment_mode: str = "cash",
        recorded_by: str = "SYSTEM"
    ) -> Transaction:

        if payment_mode not in TransactionService.ALLOWED_PAYMENT_MODES:
            raise ValueError("Invalid payment mode")

        # 🔒 Lock member row
        member = db.execute(
            select(Member)
            .where(Member.account_number == account_number)
            .with_for_update()
        ).scalar_one_or_none()

        if not member:
            raise ValueError("Member not found")

        amount = TransactionService._to_decimal(amount)

        if amount <= 0:
            raise ValueError("Amount must be positive")

        old_balance = member.balance

        if is_credit:
            new_balance = old_balance + amount
        else:
            if old_balance < amount:
                raise ValueError("Insufficient balance")
            new_balance = old_balance - amount

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
                recorded_by=recorded_by
            )

            db.add(txn)
            member.balance = new_balance

            db.commit()
            db.refresh(txn)
            return txn

        except SQLAlchemyError:
            db.rollback()
            raise

    # -----------------------------
    # DOMAIN METHODS
    # -----------------------------

    @staticmethod
    def record_monthly_share(db: Session, account_number: str, amount: Decimal, payment_mode: str = "cash"):
        """CREDIT → Monthly share capital."""
        return TransactionService._execute(
            db, account_number, amount,
            "share_capital", True,
            "Monthly Share Capital Contribution",
            payment_mode
        )

    @staticmethod
    def record_withdrawal(db: Session, account_number: str, amount: Decimal, payment_mode: str = "cash"):
        """DEBIT → Member withdrawal."""
        return TransactionService._execute(
            db, account_number, amount,
            "withdrawal", False,
            "Member Savings Withdrawal",
            payment_mode
        )

    @staticmethod
    def record_loan_installment(db: Session, account_number: str, amount: Decimal, payment_mode: str = "cash"):
        """DEBIT → Loan EMI."""
        return TransactionService._execute(
            db, account_number, amount,
            "installment", False,
            "Loan EMI Payment",
            payment_mode
        )
