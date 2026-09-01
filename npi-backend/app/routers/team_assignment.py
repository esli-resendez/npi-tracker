from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import team_repository

router = APIRouter(prefix="/api/orders/{order_id}/team", tags=["team-assignment"])


class RoleOut(BaseModel):
    role_id: int
    role_name: str


class MemberOut(BaseModel):
    user_id: int
    email: str
    display_name: Optional[str] = None
    role_id: int
    role_name: str


class MemberRoleIn(BaseModel):
    email: str
    role_name: str


class AssignRolesIn(BaseModel):
    members: List[MemberRoleIn]


@router.get("/roles", response_model=List[RoleOut])
def list_assignable_roles(order_id: int, db: Session = Depends(get_db)):
    """Roles the UI is allowed to offer in the dropdown -- ADMIN excluded."""
    return team_repository.get_assignable_roles(db)


@router.get("", response_model=List[MemberOut])
def list_order_members(order_id: int, db: Session = Depends(get_db)):
    """Current member/role assignments, used to pre-populate the UI."""
    return team_repository.get_order_members(db, order_id)


@router.post("")
def assign_roles(order_id: int, body: AssignRolesIn, db: Session = Depends(get_db)):
    if not body.members:
        raise HTTPException(status_code=400, detail="At least one member/role is required")

    try:
        for member in body.members:
            role_id = team_repository.get_assignable_role_id(db, member.role_name)
            if role_id is None:
                # Covers both "not a real role" and "tried to assign ADMIN"
                raise HTTPException(
                    status_code=400,
                    detail=f"'{member.role_name}' is not a valid assignable role"
                )

            user_id = team_repository.get_or_create_user(db, member.email)
            team_repository.upsert_order_member_role(db, order_id, user_id, role_id)

        team_repository.move_to_testplan(db, order_id)
        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Exception raised: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign roles")

    return {"order_id": order_id, "ord_status": "TESTPLAN"}
