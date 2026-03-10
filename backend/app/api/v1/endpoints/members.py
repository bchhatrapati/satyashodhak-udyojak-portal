from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberResponse, MemberStatusUpdate
from app.services.member_service import MemberService
from app.repositories.member_repo import MemberRepository
from app.api.deps import get_current_user, require_admin


router = APIRouter(
    prefix="/members",
    tags=["Members"],
)


# -------------------------------------------------------------------------
# 1. Register New Member (ADMIN ONLY)
# -------------------------------------------------------------------------

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=MemberResponse,
)
def register_member(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
):
    """
    Admin-level registration.

    Flow:
    - Supabase Auth user creation
    - Account number generation
    - Member DB record
    - Initial share deposit
    - Atomic commit
    """

    return MemberService.register_new_member(
        db=db,
        data=data,
        created_by=current_user.account_number,
    )


# -------------------------------------------------------------------------
# 2. Get My Own Profile (Member Dashboard)
# -------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=MeResponse,
    status_code=status.HTTP_200_OK
)
def get_my_profile(
    current_user: Member = Depends(get_current_user),
):
    """
    Returns the currently authenticated member profile.
    Used by the React AuthContext to restore sessions.
    """

    return {
        "user": {
            "account_number": current_user.account_number,
            "full_name": current_user.full_name,
            "role": current_user.role,
        }
    }

# -------------------------------------------------------------------------
# 3. List All Members (ADMIN DASHBOARD)
# -------------------------------------------------------------------------

@router.get(
    "/",
    response_model=List[MemberResponse],
)
def list_all_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
):
    """
    Paginated list of all members.
    Admin only.
    """

    return MemberRepository.get_all(
        db=db,
        skip=skip,
        limit=limit,
    )


# -------------------------------------------------------------------------
# 4. Get Member by Account Number (ADMIN or OWNER)
# -------------------------------------------------------------------------

@router.get(
    "/{account_number}",
    response_model=MemberResponse,
)
def get_member_by_account_number(
    account_number: str,
    db: Session = Depends(get_db),
    current_user: Member = Depends(get_current_user),
):
    """
    Access Rules:
    - ADMIN can view any member
    - A member can view their own record
    """

    account_number = account_number.strip()

    member = MemberService.get_member_by_account_number(
        db=db,
        account_number=account_number,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Privacy fence
    if (
        current_user.role.upper() != "ADMIN"
        and current_user.user_id != member.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this member",
        )

    return member


# -------------------------------------------------------------------------
# 5. Freeze / Unfreeze Member (ADMIN ONLY)
# -------------------------------------------------------------------------

@router.patch(
    "/{account_number}/status",
    response_model=MemberResponse,
)
def update_member_status(
    account_number: str,
    payload: MemberStatusUpdate,
    db: Session = Depends(get_db),
    current_user: Member = Depends(require_admin),
):
    """
    Freeze or unfreeze a member account.
    """

    account_number = account_number.strip()

    member = MemberService.update_member_status(
        db=db,
        account_number=account_number,
        is_active=payload.is_active,
        updated_by=current_user.account_number,
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    return member