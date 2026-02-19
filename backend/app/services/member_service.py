from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
from datetime import date

from app.models.members import MemberCreate
from app.database.schema import Member
from app.repositories.members_repo import MemberRepository
from app.services.id_generator import generate_next_account_number
from app.services.transaction_service import TransactionService


class MemberService:

    @staticmethod
    def register_new_member(db: Session, data: MemberCreate):
        """
        Finalized Registration Flow:
        Ensures a member is not created without their initial share capital.
        """
        if data.initial_deposit is None or data.initial_deposit <= 0:
            raise ValueError("A positive initial deposit is required")

        initial_amount = Decimal(str(data.initial_deposit))

        try:
            # 1. Generate account number (SUCCS-XXXXX)
            account_no = generate_next_account_number(db)

            # 2. Create Member folder
            new_member = Member(
                account_number=account_no,
                full_name=data.full_name,
                phone_number=data.phone_number,
                email=data.email,
                date_of_birth=data.date_of_birth,
                balance=Decimal("0.00"),
                aadhar_no=data.aadhar_no,
                pan_no=data.pan_no,
                nominee_name=data.nominee_name,
                nominee_relation=data.nominee_relation,
                monthly_installment_date=data.monthly_installment_date,
                photo_url=data.photo_url,
                aadhar_url=data.aadhar_url,
                pan_url=data.pan_url,
                is_active=True
            )

            db.add(new_member)

            # 3. Record Initial Share Capital 
            # This uses the TransactionService Accountant to handle the ledger
            TransactionService.record_monthly_share(
                db,
                account_no,
                initial_amount,
                payment_mode="cash"
            )

            db.commit() # The single "Lock" for the whole process
            db.refresh(new_member)
            return new_member

        except SQLAlchemyError:
            db.rollback() # If Member or Transaction fails, undo everything
            raise

    @staticmethod
    def check_compliance_and_deactivate(db: Session):
        """
        Scans all active members. If the current day is past their 
        installment date and no payment is found, they are deactivated.
        """
        today = date.today()
        
        # 1. Get only those who are currently active
        active_members = MemberRepository.get_all_active(db)

        try:
            for member in active_members:
                # 2. Check if they have paid this month
                is_paid = MemberRepository.has_installment_for_month(
                    db, 
                    member.account_number, 
                    today.month, 
                    today.year
                )

                # 3. Rule: If NOT paid AND the deadline (day) has passed
                if not is_paid and today.day > member.monthly_installment_date:
                    # We pass the update but don't commit yet
                    MemberRepository.update_status(
                        db, 
                        member.account_number, 
                        is_active=False
                    )

            # 4. Final step: Save all changes at once (Atomic)
            db.commit()
            
        except SQLAlchemyError:
            db.rollback()
            raise