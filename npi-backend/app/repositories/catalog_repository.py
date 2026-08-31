from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


def upsert_device_type(db: Session, part_number: str, revision: str, description: str, cls: Optional[str]) -> int:
    existing = db.execute(
        text("SELECT device_type_id FROM dbo.device_types WHERE part_number = :part_number AND revision = :revision"),
        {"part_number": part_number, "revision": revision},
    ).scalar()

    if existing is not None:
        db.execute(
            text("""UPDATE dbo.device_types
                     SET description = :description, class = :cls, dev_role = 'TOP'
                     WHERE device_type_id = :device_type_id"""),
            {"description": description, "cls": cls, "device_type_id": existing},
        )
        return existing

    return db.execute(
        text("""INSERT INTO dbo.device_types (description, part_number, revision, class, dev_role)
                 OUTPUT INSERTED.device_type_id
                 VALUES (:description, :part_number, :revision, :cls, 'TOP')"""),
        {"description": description, "part_number": part_number, "revision": revision, "cls": cls},
    ).scalar()


def link_order_device_type(db: Session, order_id: int, device_type_id: int) -> None:
    db.execute(
        text("""IF NOT EXISTS (
                    SELECT 1 FROM dbo.order_device_types
                    WHERE order_id = :order_id AND device_type_id = :device_type_id
                )
                INSERT INTO dbo.order_device_types (order_id, device_type_id)
                VALUES (:order_id, :device_type_id)"""),
        {"order_id": order_id, "device_type_id": device_type_id},
    )


def upsert_component_type(db: Session, part_number: str, revision: str, description: str, cls: Optional[str]) -> int:
    # component_types.name is NOT NULL with no equivalent column in the BOM file,
    # so we fill it from description -- see migration notes on (part_number, revision) uniqueness.
    existing = db.execute(
        text("SELECT component_type_id FROM dbo.component_types WHERE part_number = :part_number AND revision = :revision"),
        {"part_number": part_number, "revision": revision},
    ).scalar()

    if existing is not None:
        db.execute(
            text("""UPDATE dbo.component_types
                     SET name = :name, class = :cls, dev_role = 'SUB'
                     WHERE component_type_id = :component_type_id"""),
            {"name": description, "cls": cls, "component_type_id": existing},
        )
        return existing

    return db.execute(
        text("""INSERT INTO dbo.component_types (name, part_number, revision, class, dev_role)
                 OUTPUT INSERTED.component_type_id
                 VALUES (:name, :part_number, :revision, :cls, 'SUB')"""),
        {"name": description, "part_number": part_number, "revision": revision, "cls": cls},
    ).scalar()


def link_order_component_type(db: Session, order_id: int, component_type_id: int) -> None:
    db.execute(
        text("""IF NOT EXISTS (
                    SELECT 1 FROM dbo.order_component_types
                    WHERE order_id = :order_id AND component_type_id = :component_type_id
                )
                INSERT INTO dbo.order_component_types (order_id, component_type_id)
                VALUES (:order_id, :component_type_id)"""),
        {"order_id": order_id, "component_type_id": component_type_id},
    )
