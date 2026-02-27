from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import supabase
from app.repositories.members_repo import MemberRepository
from app.models.members import Member


# ----------------------------------------
# OAuth2 Scheme (Where FastAPI gets token)
# ----------------------------------------

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


# ----------------------------------------
# Get Current Authenticated Member
# ----------------------------------------

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> Member:
    """
    Validates Supabase JWT and returns the corresponding Member from DB.

    Security Flow:
    1. Validate JWT with Supabase
    2. Extract user UUID
    3. Find member in local DB
    4. Ensure member is active
    """

    try:
        # 1️⃣ Validate token with Supabase
        auth_response = supabase.auth.get_user(token)

        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user_uuid = auth_response.user.id

        # 2️⃣ Fetch Member from DB
        member = MemberRepository.get_by_user_id(db, user_uuid)

        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found",
            )

        # 3️⃣ Check account status
        if hasattr(member, "is_active") and not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        return member

    except HTTPException:
        # Re-raise known HTTP exceptions
        raise

    except Exception:
        # Unexpected failures should not leak details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error",
        )


# ----------------------------------------
# Generic Role-Based Guard
# ----------------------------------------

def require_role(required_role: str) -> Callable:
    """
    Role-based access control dependency.

    Usage:
        dependencies=[Depends(require_role("ADMIN"))]
    """

    def role_checker(current_user: Member = Depends(get_current_user)) -> Member:
        if current_user.role.upper() != required_role.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} privileges required",
            )
        return current_user

    return role_checker


# ----------------------------------------
# Convenience Admin Guard
# ----------------------------------------

def require_admin(
    current_user: Member = Depends(get_current_user),
) -> Member:
    """
    Shortcut for ADMIN-only routes.
    """
    if current_user.role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user