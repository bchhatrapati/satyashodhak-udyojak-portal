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
    Bank-Grade Security Handshake:
    Ensures any failure results in a 401 (Logout) rather than a 500 (Crash).
    """

    token = request.cookies.get("access_token")
    # 1. No token? Return 401 so the Frontend/Middleware redirects to /login
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found",
        )

    try:
        # 2. Validate token with Supabase
        auth_response = supabase.auth.get_user(token)

        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired",
            )

        user_uuid = auth_response.user.id

        # 3. Fetch Member from DB
        member = MemberRepository.get_by_user_id(db, user_uuid)

        # 4. If the user exists in Supabase but NOT in your DB, 
        # it's still a 401 (Unauthorized), not a 404 (Not Found).
        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile missing",
            )

        # 5. Check account status
        if hasattr(member, "is_active") and not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        return member

    except HTTPException as e:
        # Re-raise planned Auth errors (401, 403)
        raise e

    except Exception as e:
        # 🔥 CRITICAL CHANGE:
        # Log the error for you to see in the terminal,
        # but return 401 to the browser so the app doesn't freeze.
        print(f"DEBUG: Unexpected Auth Error: {str(e)}") 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
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