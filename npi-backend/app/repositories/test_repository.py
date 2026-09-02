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