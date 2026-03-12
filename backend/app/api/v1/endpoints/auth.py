# app/api/v1/endpoints/auth.py
import os
from fastapi import APIRouter, Depends, status, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.services.auth_service import AuthService
from app.core.config import supabase


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# 1. Detect environment
is_prod = os.getenv("ENVIRONMENT") == "production"

# 2. Define Bank-Grade Cookie Policies
# PRODUCTION: Must be Secure, SameSite=None (for Vercel -> Railway)
# LOCAL: Secure=False (usually), SameSite=Lax (for Localhost)
if is_prod:
    cookie_secure = True
    cookie_samesite = "none" # 👈 Required for Vercel/Railway cross-domain
else:
    cookie_secure = False    # Localhost usually doesn't have SSL/HTTPS
    cookie_samesite = "lax"  # Standard for local development
# ============================================================
# REQUEST SCHEMA
# ============================================================

class LoginRequest(BaseModel):
    account_number: str = Field(
        ...,
        min_length=3,
        max_length=20,
        example="AC001"
    )

    password: str = Field(
        ...,
        min_length=6,
        example="StrongPassword123"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "account_number": "AC001",
                "password": "StrongPassword123"
            }
        }


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

class UserResponse(BaseModel):
    account_number: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    user: UserResponse

    class Config:
        from_attributes = True


# ============================================================
# LOGIN ENDPOINT
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Login using Account Number",
    description="Authenticates member using Account Number mapped to Supabase email."
)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Secure login endpoint.

    Security features:
    - Uses Supabase authentication
    - Tokens stored in HTTP-only cookies
    - Tokens NOT returned in JSON response
    """

    try:

        result = AuthService.login_with_account_number(
            db=db,
            account_number=data.account_number.strip().upper(),
            password=data.password
        )

        # --------------------------------------------------
        # ACCESS TOKEN COOKIE
        # --------------------------------------------------

        response.set_cookie(
            key="access_token",
            value=result["access_token"],
            httponly=True,
            secure=cookie_secure,          # must be True in production (HTTPS)
            samesite=cookie_samesite,
            path="/",
            max_age=60 * 15       # 15 minutes
        )

        # --------------------------------------------------
        # REFRESH TOKEN COOKIE
        # --------------------------------------------------

        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path="/",
            max_age=60 * 60 * 24 * 7   # 7 days
        )

        return {
            "user": result["user"]
        }

    except ValueError as e:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except HTTPException as http_exc:   
        raise http_exc
        
    except Exception as e:
        # 🔥 ADD THIS PRINT STATEMENT to see the real error in the terminal
        print(f"🥊 CRITICAL LOGIN ERROR: {str(e)}") 
        import traceback
        traceback.print_exc() 

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login service unavailable"
        )


# ============================================================
# LOGOUT ENDPOINT
# ============================================================

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout current user"
)
def logout(response: Response):
    """
    Logs out user by:

    1. Invalidating Supabase session
    2. Removing authentication cookies
    """

    try:
        # Invalidate Supabase session
        supabase.auth.sign_out()

    except Exception:
        # Avoid exposing internal errors
        pass

    # --------------------------------------------------
    # DELETE ACCESS TOKEN COOKIE
    # --------------------------------------------------

    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite
    )

    # --------------------------------------------------
    # DELETE REFRESH TOKEN COOKIE
    # --------------------------------------------------

    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite
    )

    return {
        "message": "Logged out successfully"
    }

# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    summary="Refresh access token"
)
def refresh_token(request: Request, response: Response):
    """
    Refresh authentication tokens using refresh token cookie.

    Security Features:
    - Uses HTTP-only cookies
    - Rotates refresh tokens
    - Clears cookies if refresh fails
    """
    print(f"refesh token request received")
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    try:
        # Ask Supabase for new session
        session = supabase.auth.refresh_session({
            "refresh_token": refresh_token
        })

        if not session or not session.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        new_access_token = session.session.access_token
        new_refresh_token = session.session.refresh_token

        # 🔐 Issue new cookies (TOKEN ROTATION)
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path="/",
            max_age=60 * 15  # 15 minutes
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite=cookie_samesite,
            path="/",
            max_age=60 * 60 * 24 * 7  # 7 days
        )

        return {"message": "Token refreshed"}

    except Exception:

        # 🔥 Security: remove invalid cookies
        response.delete_cookie("access_token", path="/", secure=cookie_secure, samesite=cookie_samesite)
        response.delete_cookie("refresh_token", path="/", secure=cookie_secure, samesite=cookie_samesite)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please login again."
        )