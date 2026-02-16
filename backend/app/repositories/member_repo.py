from sqlalchemy.orm import Session
from sqlalchemy import func, select, update
from sqlalchemy.exc import SQLAlchemyError
from app.database.schema import Member
from decimal import Decimal
from typing import Optional, Dict


class MemberRepository:
    """
    Repository layer for Member table.

    Responsibility:
    - Talk to the database
    - Execute SQL/ORM operations
    - NEVER contain business logic
    """

    @staticmethod
    def save(db: Session, member: Member) -> Member:
        """
        Inserts or updates a Member record.

        - Commits the transaction
        - Refreshes the instance to load DB-generated fields
          (joining_date, updated_at, defaults, etc.)
        - Rolls back safely if any DB error occurs
        """
        try:
            db.add(member)
            db.commit()
            db.refresh(member)
            return member
        except SQLAlchemyError:
            db.rollback()
            raise

    @staticmethod
    def get_by_account_number(
        db: Session,
        account_number: str
    ) -> Optional[Member]:
        """
        Fetch a single member using their SUCCS account number.

        Returns:
            Member object if found
            None if not found
        """
        return (
            db.query(Member)
            .filter(Member.account_number == account_number)
            .first()
        )

    @staticmethod
    def get_stats(db: Session) -> Dict:
        """
        Returns dashboard statistics in ONE optimized query:

        - Total members
        - Active members
        - Inactive members
        - Total society funds

        Using Decimal for accurate financial calculations.
        """

        stmt = select(
            func.count(Member.account_number),                      # total members
            func.count().filter(Member.is_active.is_(True)),       # active members
            func.coalesce(func.sum(Member.balance), Decimal("0.00"))  # total balance
        )

        total, active, total_funds = db.execute(stmt).one()

        return {
            "total_members": total,
            "active_members": active,
            "inactive_members": total - active,
            "total_society_funds": total_funds
        }

    @staticmethod
    def update_status(
        db: Session,
        account_number: str,
        is_active: bool
    ) -> None:
        """
        Updates a member's active/inactive status.

        Used for:
        - Manual admin control
        - Automatic deactivation on rule violations
        """
        try:
            db.execute(
                update(Member)
                .where(Member.account_number == account_number)
                .values(is_active=is_active)
            )
            db.commit()
        except SQLAlchemyError:
            db.rollback()
            raise
