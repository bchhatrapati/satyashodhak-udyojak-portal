import os
import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientError # 🛡️ Added for safe error catching
from typing import Callable

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.config import supabase
from app.repositories.member_repo import MemberRepository
from app.models.member import Member

# =======================================================================
# 🚀 ENTERPRISE JWKS CACHING
# =======================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from environment variables.")

jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(jwks_url)

# ----------------------------------------
# Get Current Authenticated Member
# ----------------------------------------

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> Member:
    """
    Bank-Grade Security Handshake:
    Verifies the Supabase JWT locally using Asymmetric Public Keys (JWKS).
    """

    token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session not found",
        )

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # 🛡️ ENTERPRISE FIX 1: Removed HS256 to prevent downgrade attacks
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"], 
            audience="authenticated"
        )

        user_uuid = payload.get("sub")

        if not user_uuid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        member = MemberRepository.get_by_user_id(db, user_uuid)

        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User profile missing",
            )

        if hasattr(member, "is_active") and not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        return member

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )
    # 🛡️ ENTERPRISE FIX 3: Catch JWKS Client Errors gracefully
    except (jwt.InvalidTokenError, PyJWKClientError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"DEBUG: Unexpected Auth Error: {str(e)}") 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )

# ----------------------------------------
# Generic Role-Based Guard
# ----------------------------------------

def require_role(required_role: str) -> Callable:
    def role_checker(current_user: Member = Depends(get_current_user)) -> Member:
        # 🛡️ ENTERPRISE FIX 2: Safe role extraction
        user_role = getattr(current_user, "role", "") or ""
        
        if user_role.upper() != required_role.upper():
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
    # 🛡️ ENTERPRISE FIX 2: Safe role extraction
    user_role = getattr(current_user, "role", "") or ""
    
    if user_role.upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user