# app/api/v1/endpoints/auth.py
import os
from fastapi import APIRouter, Depends, status, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from gotrue.errors import AuthApiError # 🛡️ Import Supabase's specific error

from app.database.session import get_db
from app.models.member import Member
from app.api.deps import get_current_user
from app.services.auth_service import AuthService
from app.core.config import supabase, supabase_admin


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
        session = supabase.auth.refresh_session(refresh_token)

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

    except Exception as e:

        print(f"Token Refresh Failed: {str(e)}")
        # 🔥 Security: remove invalid cookies
        response.delete_cookie("access_token", path="/", secure=cookie_secure, samesite=cookie_samesite)
        response.delete_cookie("refresh_token", path="/", secure=cookie_secure, samesite=cookie_samesite)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please login again."
        )

    
# ==========================================
# 4. UPDATE PASSWORD
# POST /api/v1/auth/update-password
# ==========================================

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

@router.post("/update-password")
def update_password(
    payload: PasswordUpdate,
    current_user: Member = Depends(get_current_user) 
):
    """
    Securely updates a member's password using Supabase Auth directly.
    Includes diagnostic print statements for safe debugging.
    """
    print(f"\n--- ATTEMPTING PASSWORD UPDATE FOR: {current_user.account_number} ---")
    
    # 1. Safely extract email (Prevents AttributeError if the column is missing in models)
    user_email = getattr(current_user, 'email', None)
    
    if not user_email:
        print("❌ ERROR: current_user.email is empty or missing from the Member model!")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email associated with this account in the database."
        )

    print(f"📧 Using Email: {user_email}")

    # 2. Verify the Old Password via Supabase Auth
    try:
        print("🔒 Verifying old password with Supabase...")
        supabase.auth.sign_in_with_password({
            "email": user_email, 
            "password": payload.old_password
        })
        print("✅ Old password verified successfully.")
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Supabase Verification Error: {error_msg}")
        
        # Safely catch Supabase's specific invalid credentials message across all versions
        if "Invalid login credentials" in error_msg or "invalid_credentials" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password."
            )
        
        # If it's a real server error (like network down), show this:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication service unavailable: {error_msg}"
        )

    # 3. Prevent reusing the same password
    if payload.old_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as your current password."
        )

    # 4. Update the password securely using the Admin client
    try:
        print(f"🔄 Sending new password to Supabase Admin for UUID: {current_user.user_id}")
        supabase_admin.auth.admin.update_user_by_id(
            str(current_user.user_id), 
            {"password": payload.new_password}
        )
        print("✅ Password updated successfully!")
        
        return {"message": "Password updated successfully"}
        
    except Exception as e:
        print(f"❌ Supabase Admin Update Failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password in Supabase."
        )