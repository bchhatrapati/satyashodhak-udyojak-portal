from typing import Callable

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import supabase
from app.repositories.member_repo import MemberRepository
from app.models.member import Member


# ----------------------------------------
# Get Current Authenticated Member
# ----------------------------------------

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Member:
    """
    Validates Supabase JWT from HTTP-only cookie
    and returns the corresponding Member from DB.

    Security Flow:
    1. Extract access_token from cookies
    2. Validate JWT with Supabase
    3. Extract user UUID
    4. Find member in local DB
    5. Ensure member is active
    """

    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

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
        raise

    except Exception:
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


# ----------------------------------------
# Convenience Member Guard
# ----------------------------------------

def require_member(
    current_user: Member = Depends(get_current_user),
) -> Member:
    """
    Allows both MEMBER and ADMIN.
    """
    if current_user.role.upper() not in ["MEMBER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Member access required",
        )
    return current_user