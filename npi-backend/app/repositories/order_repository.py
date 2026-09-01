from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_builds_for_user(db: Session, username: str):
    rows = db.execute(
        text("""SELECT o.order_id, o.order_number, o.ord_status, o.progress, o.start_date
                 FROM dbo.orders o
                 JOIN dbo.order_users ou ON ou.order_id = o.order_id
                 JOIN dbo.users u ON u.user_id = ou.user_id
                 WHERE u.username = :username AND o.ord_status IN ('ACTIVE', 'DRAFT')
                 ORDER BY o.created_at DESC"""),
        {"username": username},
    ).mappings().all()
    return [dict(row) for row in rows]


def get_order_racks(db: Session, order_id: int):
    rows = db.execute(
        text("""SELECT r.rack_id, r.rack_serial, r.rack_sku, r.rack_gen_name, orck.rack_sequence
                 FROM dbo.racks r
                 JOIN dbo.order_racks orck ON orck.rack_id = r.rack_id
                 WHERE orck.order_id = :order_id
                 ORDER BY orck.rack_sequence"""),
        {"order_id": order_id},
    ).mappings().all()
    return [dict(row) for row in rows]


def order_to_assign(db: Session, order_id: int, start_date: date) -> None:
    result = db.execute(
        text("""UPDATE dbo.orders
                 SET start_date = :start_date, ord_status = 'UNASSIGNED', updated_at = SYSUTCDATETIME()
                 WHERE order_id = :order_id AND ord_status = 'DRAFT'"""),
        {"start_date": start_date, "order_id": order_id},
    )
    if result.rowcount == 0:
        raise ValueError(f"Order {order_id} was not activated -- it may not exist or is not in DRAFT status")
