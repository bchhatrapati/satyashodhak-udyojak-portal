from sqlalchemy.orm import Session
from app.models.member import MemberCreate, MemberResponse
from app.repositories.members_repo import MemberRepository
from app.services.id_generator import generate_next_account_number
from app.database.schema import Member as MemberDBModel # The actual SQL table class

class MemberService:
    @staticmethod
    def create_member(db: Session, member_data: MemberCreate) -> MemberResponse:
        # 1. GENERATE THE UNIQUE ID
        # This calls your SUCCS logic we just wrote
        new_account_no = generate_next_account_number(db)

        # 2. CONVERT PYDANTIC MODEL TO DATABASE MODEL
        # We exclude 'initial_deposit' because it goes to the transactions table, not members
        db_member = MemberDBModel(
            account_number=new_account_no,
            full_name=member_data.full_name,
            phone_number=member_data.phone_number,
            email=member_data.email,
            date_of_birth=member_data.date_of_birth,
            aadhar_no=member_data.aadhar_no,
            pan_no=member_data.pan_no,
            nominee_name=member_data.nominee_name,
            nominee_relation=member_data.nominee_relation,
            monthly_installment_date=member_data.monthly_installment_date,
            photo_url=member_data.photo_url,
            aadhar_url=member_data.aadhar_url,
            pan_url=member_data.pan_url,
            balance=member_data.initial_deposit, # Setting the starting balance
            is_active=True
        )

        # 3. SAVE TO DATABASE
        # This is where the Repository layer comes in
        new_member = MemberRepository.save(db, db_member)

        # 4. TODO: CREATE INITIAL TRANSACTION
        # Here we would call TransactionService to record the initial deposit

        return new_member