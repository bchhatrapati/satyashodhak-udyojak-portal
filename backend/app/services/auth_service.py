# app/services/auth_service.py

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import supabase
from app.repositories.member_repo import MemberRepository


class AuthService:
    """
    Handles authentication using:
    Account Number → Email mapping → Supabase Auth
    """

    @staticmethod
    def login_with_account_number(
        db: Session,
        account_number: str,
        password: str
    ):
        """
        1. Find member by account number
        2. Use member.email to authenticate with Supabase
        3. Return JWT + member info
        """

        # ------------------------------------
        # Step 1: Validate Member
        # ------------------------------------
        try:
            member = MemberRepository.get_by_account(db, account_number)
        except SQLAlchemyError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error"
            )

        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Account Number"
            )

        if not member.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Member email not configured"
            )

        # Optional: If you have is_active column
        if hasattr(member, "is_active") and not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )

        # ------------------------------------
        # Step 2: Authenticate with Supabase
        # ------------------------------------
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": member.email,
                "password": password
            })

            # Validate Supabase response
            if not auth_response or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Credentials"
                )

        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Credentials"
            )

        # ------------------------------------
        # Step 3: Optional Safety Check
        # ------------------------------------
        if member.user_id and str(member.user_id) != auth_response.user.id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User mismatch detected"
            )

        # ------------------------------------
        # Step 4: Return Auth Payload
        # ------------------------------------
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "token_type": "bearer",
            "user": {
                "account_number": member.account_number,
                "full_name": member.full_name,
                "role": member.role
            }
        }