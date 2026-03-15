from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from app.api.deps import get_db, require_admin
from app.services.member_service import MemberService
from app.models.member import Member

router = APIRouter()

@router.get("/admin-stats", response_model=Dict)
def get_admin_statistics(
    # 1. 🛡️ Supabase + DB Role Guard: Intercepts non-admins immediately
    current_admin: Member = Depends(require_admin), 
    # 2. Database Connection
    db: Session = Depends(get_db)
):
    """
    Secure endpoint to fetch dashboard statistics.
    Accessible ONLY by active users with the 'ADMIN' role in the DB.
    """
    return MemberService.get_admin_stats(db)