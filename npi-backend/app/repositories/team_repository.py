from typing import List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_assignable_roles(db: Session) -> List[dict]:
    """All roles except ADMIN -- ADMIN is never selectable from the UI."""
    rows = db.execute(
        text("""SELECT role_id, role_name FROM dbo.roles
                 WHERE role_name <> 'ADMIN'
                 ORDER BY role_name""")
    ).mappings().all()
    return [dict(row) for row in rows]


def get_assignable_role_id(db: Session, role_name: str) -> Optional[int]:
    """Looks up a role_id by name, but only among assignable (non-ADMIN) roles.
    Used server-side so a client can't smuggle 'ADMIN' into the POST body
    even though the UI never offers it as an option."""
    return db.execute(
        text("""SELECT role_id FROM dbo.roles
                 WHERE role_name = :role_name AND role_name <> 'ADMIN'"""),
        {"role_name": role_name}
    ).scalar()


def get_order_members(db: Session, order_id: int) -> List[dict]:
    """Current members of an order with their assigned role -- used to
    pre-populate the assignment UI."""
    rows = db.execute(
        text("""SELECT u.user_id, u.email, u.display_name, r.role_id, r.role_name
                 FROM dbo.order_users ou
                 JOIN dbo.users u ON u.user_id = ou.user_id
                 JOIN dbo.roles r ON r.role_id = ou.role_id
                 WHERE ou.order_id = :order_id
                 ORDER BY u.email"""),
        {"order_id": order_id}
    ).mappings().all()
    return [dict(row) for row in rows]


def get_or_create_user(db: Session, email: str) -> int:
    """Same get-or-create-by-email pattern used in DataOperationsNewOrder.
    Duplicated here (rather than imported from data_operations) because that
    class isn't structured as a shared repository -- worth consolidating into
    a single user_repository.py later if this pattern is needed a third time."""
    normalized_email = email.strip().lower()

    existing = db.execute(
        text("SELECT user_id FROM dbo.users WHERE email = :email"),
        {"email": normalized_email}
    ).scalar()

    if existing is not None:
        return existing

    return db.execute(
        text("""INSERT INTO dbo.users (username, email)
                 OUTPUT INSERTED.user_id
                 VALUES (:username, :email)"""),
        {"username": normalized_email, "email": normalized_email}
    ).scalar()


def upsert_order_member_role(db: Session, order_id: int, user_id: int, role_id: int) -> None:
    """Updates the role if this user is already linked to the order,
    otherwise inserts a new order_users row (covers the 'add more members'
    case in the UI)."""
    result = db.execute(
        text("""UPDATE dbo.order_users SET role_id = :role_id
                 WHERE order_id = :order_id AND user_id = :user_id"""),
        {"role_id": role_id, "order_id": order_id, "user_id": user_id}
    )

    if result.rowcount == 0:
        db.execute(
            text("""INSERT INTO dbo.order_users (order_id, user_id, role_id)
                     VALUES (:order_id, :user_id, :role_id)"""),
            {"order_id": order_id, "user_id": user_id, "role_id": role_id}
        )


def move_to_testplan(db: Session, order_id: int) -> None:
    result = db.execute(
        text("""UPDATE dbo.orders
                 SET ord_status = 'TESTPLAN', updated_at = SYSUTCDATETIME()
                 WHERE order_id = :order_id AND ord_status = 'UNASIGNED'"""),
        {"order_id": order_id}
    )
    if result.rowcount == 0:
        raise ValueError(
            f"Order {order_id} was not moved to TESTPLAN -- it may not exist or is not in UNASIGNED status"
        )
