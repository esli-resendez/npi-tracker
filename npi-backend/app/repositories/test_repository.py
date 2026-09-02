from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_test_case_by_name(db: Session, test_name: str) -> Optional[dict]:
    row = db.execute(
        text("""SELECT test_case_id, test_description, test_level, duration_minutes
                 FROM dbo.test_cases WHERE test_name = :test_name"""),
        {"test_name": test_name},
    ).mappings().first()
    return dict(row) if row else None


def create_test_case(
    db: Session,
    test_name: str,
    test_description: Optional[str],
    test_level: str,
    duration_minutes: Optional[int],
) -> int:
    return db.execute(
        text("""INSERT INTO dbo.test_cases
                     (test_name, test_description, test_level, duration_minutes)
                 OUTPUT INSERTED.test_case_id
                 VALUES (:test_name, :test_description, :test_level, :duration_minutes)"""),
        {
            "test_name": test_name,
            "test_description": test_description,
            "test_level": test_level,
            "duration_minutes": duration_minutes,
        },
    ).scalar()


def get_linked_case_ids(db: Session, test_plan_id: int) -> set[int]:
    rows = db.execute(
        text("SELECT test_case_id FROM dbo.test_plan_cases WHERE test_plan_id = :test_plan_id"),
        {"test_plan_id": test_plan_id},
    ).all()
    return {r[0] for r in rows}


def link_case_to_plan(db: Session, test_plan_id: int, test_case_id: int, sequence: Optional[int]) -> None:
    db.execute(
        text("""INSERT INTO dbo.test_plan_cases (test_plan_id, test_case_id, sequence)
                 VALUES (:test_plan_id, :test_case_id, :sequence)"""),
        {"test_plan_id": test_plan_id, "test_case_id": test_case_id, "sequence": sequence},
    )


def get_or_create_test_plan(db: Session, test_plan_name: str) -> int:
    existing = db.execute(
        text("SELECT test_plan_id FROM dbo.test_plans WHERE test_plan_name = :name"),
        {"name": test_plan_name},
    ).scalar()
    if existing is not None:
        return existing
    return db.execute(
        text("""INSERT INTO dbo.test_plans (test_plan_name)
                 OUTPUT INSERTED.test_plan_id
                 VALUES (:name)"""),
        {"name": test_plan_name},
    ).scalar()

def assign_plan_to_order(db: Session, order_id: int, test_plan_id: int) -> None:
    """Upsert: an order has at most one test plan (order_id is the PK on
    order_test_plan), so re-assigning just repoints it to the new plan."""
    existing = db.execute(
        text("SELECT order_id FROM dbo.order_test_plan WHERE order_id = :order_id"),
        {"order_id": order_id},
    ).scalar()

    if existing is not None:
        db.execute(
            text("""UPDATE dbo.order_test_plan
                     SET test_plan_id = :test_plan_id, assigned_at = SYSUTCDATETIME()
                     WHERE order_id = :order_id"""),
            {"test_plan_id": test_plan_id, "order_id": order_id},
        )
    else:
        db.execute(
            text("""INSERT INTO dbo.order_test_plan (order_id, test_plan_id)
                     VALUES (:order_id, :test_plan_id)"""),
            {"order_id": order_id, "test_plan_id": test_plan_id},
        )


def get_available_test_plans_for_order(db: Session, order_id: int) -> list[dict]:
    """Finds test plans previously used on *other* orders that share this
    order's rack SKU. Since an order has one rack SKU (possibly across
    multiple rack rows), we pull the SKU from any of its racks."""
    rows = db.execute(
        text("""
            SELECT DISTINCT tp.test_plan_id, tp.test_plan_name, tp.test_plan_description
            FROM dbo.order_racks orck_self
            JOIN dbo.racks r_self ON r_self.rack_id = orck_self.rack_id
            JOIN dbo.racks r_other ON r_other.rack_sku = r_self.rack_sku
            JOIN dbo.order_racks orck_other ON orck_other.rack_id = r_other.rack_id
            JOIN dbo.order_test_plan otp ON otp.order_id = orck_other.order_id
            JOIN dbo.test_plans tp ON tp.test_plan_id = otp.test_plan_id
            WHERE orck_self.order_id = :order_id
              AND orck_other.order_id != :order_id
            ORDER BY tp.test_plan_name
        """),
        {"order_id": order_id},
    ).mappings().all()
    return [dict(row) for row in rows]

# test_repository.py
def create_test_plan(db: Session, test_plan_name: str, test_plan_description: Optional[str]) -> int:
    return db.execute(
        text("""INSERT INTO dbo.test_plans (test_plan_name, test_plan_description)
                 OUTPUT INSERTED.test_plan_id
                 VALUES (:name, :description)"""),
        {"name": test_plan_name, "description": test_plan_description},
    ).scalar()