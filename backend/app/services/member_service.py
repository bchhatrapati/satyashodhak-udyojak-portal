from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
from datetime import date

from app.models.members import MemberCreate
from app.database.schema import Member
from app.repositories.members_repo import MemberRepository
from app.services.id_generator import generate_next_account_number
from app.services.transaction_service import TransactionService
from app.core.config import supabase_admin # Import our Master Worker

class MemberService:

    @staticmethod
    def register_new_member(db: Session, data: MemberCreate):
        """
        Finalized Registration Flow with Auth:
        Creates a Supabase Login, generates SUCCS ID, and records initial deposit.
        """
        if data.initial_deposit is None or data.initial_deposit <= 0:
            raise ValueError("A positive initial deposit is required")

        initial_amount = Decimal(str(data.initial_deposit))
        new_uuid = None # To track if we need to cleanup Supabase on failure

        try:
            # 1. STEP ONE: Create Auth user in Supabase Secret Vault
            # Admin creates the account using the member's email
            auth_response = supabase_admin.auth.admin.create_user({
                "email": data.email,
                "password": "TempPassword123", # Can be customized
                "email_confirm": True
            })
            
            if not auth_response or not auth_response.user:
                raise Exception("Failed to create auth user in Supabase")
            
            new_uuid = auth_response.user.id

            # 2. STEP TWO: Generate local account number (SUCCS-XXXXX)
            account_no = generate_next_account_number(db)

            # 3. STEP THREE: Create Member folder with the linked UUID
            new_member = Member(
                account_number=account_no,
                user_id=new_uuid, # THE PERMANENT LINK
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
                is_active=True,
                role="member" # Standard isolation role
            )

            db.add(new_member)

            # 4. STEP FOUR: Record Initial Share Capital 
            TransactionService.record_monthly_share(
                db=db,
                account_number=account_no,
                amount=initial_amount,
                payment_mode="cash",
                auto_commit=False,  # Let the outer registration transaction commit once
            )

            db.commit() 
            db.refresh(new_member)
            return new_member

        except Exception as e:
            db.rollback() 
            # 🛑 IMPORTANT: If we created a login but the DB failed, delete the login
            if new_uuid:
                supabase_admin.auth.admin.delete_user(new_uuid)
            raise e

    @staticmethod
    def check_compliance_and_deactivate(db: Session):
        # ... (Your existing compliance logic is perfect as is) ...
        today = date.today()
        active_members = MemberRepository.get_all_active(db)

        try:
            for member in active_members:
                is_paid = MemberRepository.has_installment_for_month(
                    db, member.account_number, today.month, today.year
                )

                if not is_paid and today.day > member.monthly_installment_date:
                    MemberRepository.update_status(db, member.account_number, is_active=False)

            db.commit()
            
        except SQLAlchemyError:
            db.rollback()
            raise