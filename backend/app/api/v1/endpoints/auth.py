from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# REQUEST SCHEMA
# -------------------------

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


# -------------------------
# RESPONSE SCHEMAS
# -------------------------

class UserResponse(BaseModel):
    account_number: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

    class Config:
        from_attributes = True


# -------------------------
# ROUTE
# -------------------------

@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Login using Account Number",
    description="Authenticates member using Account Number mapped to Supabase email."
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login_with_account_number(
            db=db,
            account_number=data.account_number.strip().upper(),
            password=data.password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))