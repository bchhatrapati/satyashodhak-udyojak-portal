import os
from typing import List

from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberResponse, MemberStatusUpdate
from app.services.member_service import MemberService
from app.repositories.member_repo import MemberRepository
from app.api.deps import get_current_user, require_admin
from app.api.v1.endpoints.auth import LoginResponse, UserResponse
from supabase import create_client


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
    )


# -------------------------------------------------------------------------
# 2. Get My Own Profile (Member Dashboard)
# -------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK
)
def get_my_profile(
    current_user: Member = Depends(get_current_user),
):
    """
    Returns the currently authenticated member profile.
    Used by the React AuthContext to restore sessions.
    """

    return LoginResponse(user=UserResponse(
        account_number=current_user.account_number,
        full_name=current_user.full_name,
        role=current_user.role,
    ))

# -------------------------------------------------------------------------
# 3. List All Members (ADMIN DASHBOARD)
# -------------------------------------------------------------------------

@router.get(
    "",
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

    return MemberRepository.get_all_members(
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

    member = MemberRepository.get_by_account_number(
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


ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
ALLOWED_EXT = {"jpg", "jpeg", "png", "pdf"}
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1MB

@router.post("/upload-documents")
def upload_member_documents(
    aadhar_no: str = Form(...),
    photo: UploadFile = File(...),
    aadhar: UploadFile = File(...),
    pan: UploadFile | None = File(None),
    current_user: Member = Depends(require_admin) # 🛡️ Maintains your security lock
):
    try:
        # 🚀 THE FIX: Create a thread-local client to completely bypass httpx deadlocks
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        local_supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        base_path = f"{aadhar_no}"

        files_to_upload = {
            "photo": photo,
            "aadhar": aadhar,
            "pan": pan
        }

        urls = {}

        for doc_type, file in files_to_upload.items():
            if file is None:
                continue

            ext = file.filename.split(".")[-1].lower()

            if file.content_type not in ALLOWED_TYPES or ext not in ALLOWED_EXT:
                raise HTTPException(
                    status_code=400,
                    detail=f"{doc_type} invalid file type"
                )

            # Synchronous read for the background thread
            file_bytes = file.file.read()

            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"{doc_type} exceeds 1MB limit"
                )

            file_path = f"{base_path}/{doc_type}.{ext}"

            # 👇 Using the local thread-safe client instead of the global one
            upload_res = local_supabase.storage.from_("member-documents").upload(
                path=file_path,
                file=file_bytes,
                file_options={
                    "content-type": file.content_type,
                    "upsert": "true"
                }
            )

            if isinstance(upload_res, dict) and upload_res.get("error"):
                raise HTTPException(
                    status_code=500,
                    detail=f"{doc_type} upload failed"
                )

            signed_url_res = local_supabase.storage.from_("member-documents").create_signed_url(
                path=file_path,
                expires_in=315360000  # 10 years
            )

            urls[f"{doc_type}_url"] = signed_url_res["signedURL"]

        return urls

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Backend Storage Error: {str(e)}"
        )