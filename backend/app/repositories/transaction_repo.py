from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from sqlalchemy.exc import SQLAlchemyError
from app.models.transaction import Transaction
from typing import List


class TransactionRepository:
    """
    Repository layer for the Transaction ledger.

    Responsibility:
    - Persist transaction records
    - Fetch transaction history
    - No business logic (math happens in service layer)
    """

    @staticmethod
    def create(db: Session, transaction: Transaction) -> Transaction:
        """
        Inserts a new transaction record.

        - Commits the transaction
        - Refreshes the instance to load DB-generated fields
        - Rolls back safely if any DB error occurs
        """
        try:
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            return transaction
        except SQLAlchemyError:
            db.rollback()
            raise

    @staticmethod
    def get_history(
        db: Session,
        account_number: str,
        limit: int = 15
    ) -> List[Transaction]:
        """
        Returns the passbook-style transaction history.

        - Filters by member account number
        - Orders newest → oldest
        - Limit prevents huge result sets
        """

        stmt = (
            select(Transaction)
            .where(Transaction.account_number == account_number)
            .order_by(desc(Transaction.created_at))
            .limit(limit)
        )

        return db.execute(stmt).scalars().all()
