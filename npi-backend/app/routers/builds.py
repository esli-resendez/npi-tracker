from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import order_repository

router = APIRouter(prefix="/api/builds", tags=["builds"])


@router.get("")
def list_builds(username: str, db: Session = Depends(get_db)):
    """Matches the query-param style already used by /api/orders/my-active --
    swap this for a real auth dependency once you have one."""
    return order_repository.get_builds_for_user(db, username)
