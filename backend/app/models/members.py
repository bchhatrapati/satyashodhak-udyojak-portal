"""
Compatibility module.

Previously contained Pydantic schemas for members.
Those schemas now live in `app.schemas.member`.

This module re-exports:
- ORM `Member` model (for code that did `from app.models.members import Member`)
- Pydantic schemas (for code that used `MemberCreate`, etc.)
"""

from app.models.member import Member
from app.schemas.member import (
    MemberBase,
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberStatusUpdate,
)

__all__ = [
    "Member",
    "MemberBase",
    "MemberCreate",
    "MemberUpdate",
    "MemberResponse",
    "MemberStatusUpdate",
]