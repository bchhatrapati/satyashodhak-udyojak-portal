from sqlalchemy.orm import Session
from sqlalchemy import func, select, update, exists, extract # Added exists and extract
from sqlalchemy.exc import SQLAlchemyError
from app.models.member import Member
from decimal import Decimal
from typing import Optional, Dict
from uuid import UUID
from app.models.transaction import Transaction # Added Transaction model

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
        Does NOT commit. (Service layer controls transactions)
        """
        db.execute(
            update(Member)
            .where(Member.account_number == account_number)
            .values(is_active=is_active)
        )
            
    @staticmethod
    def get_all_members(db: Session, skip: int = 0, limit: int = 50):
        """
        Returns members in pages.
        Prevents memory overload.
        """
        return db.query(Member).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_active(db: Session, skip: int = 0, limit: int = 50):
        return db.query(Member).filter(Member.is_active == True).offset(skip).limit(limit).all()

    @staticmethod
    def has_installment_for_month(
        db: Session,
        account_number: str,
        month: int,
        year: int
    ) -> bool:
        """
        Checks whether a member has made their required payment
        (share capital OR loan installment) for the given month/year.
        """

        query = db.query(
            exists().where(
                Transaction.account_number == account_number,
                Transaction.transaction_type.in_(
                    ["share_capital", "installment"]
                ),
                extract("month", Transaction.created_at) == month,
                extract("year", Transaction.created_at) == year
            )
        )

        return query.scalar()

    @staticmethod
    def get_by_user_id(db: Session, user_uuid: str | UUID) -> Member | None:
        """
        🏦 SECURE LOOKUP:
        Fetches a member profile using the Supabase Auth UUID.
        Returns the Member object if found, otherwise returns None.
        """
        # Note: Ensure 'user_id' matches the exact column name in your Member model 
        # where you store the Supabase UUID. (Sometimes it's called 'auth_id' or 'uuid')
        return db.query(Member).filter(Member.user_id == (str(user_uuid) if isinstance(user_uuid, UUID) else user_uuid)).first()