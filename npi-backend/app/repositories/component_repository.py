from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


def get_device_id_for_order(db: Session, order_id: int, serial_number: str) -> int:
    device_id = db.execute(
        text("""SELECT dar.device_id
                 FROM dbo.devices_at_racks dar
                 JOIN dbo.rack_positions rp ON rp.rack_position_id = dar.rack_position_id
                 JOIN dbo.order_racks orck ON orck.rack_id = rp.rack_id
                 WHERE orck.order_id = :order_id AND dar.serial_number = :serial_number"""),
        {"order_id": order_id, "serial_number": serial_number},
    ).scalar()

    if device_id is None:
        raise ValueError(f"Device serial '{serial_number}' was not found on this order's racks")
    return device_id


def get_component_type_id_for_order(db: Session, order_id: int, part_number: str) -> int:
    rows = db.execute(
        text("""SELECT ct.component_type_id FROM dbo.component_types ct
                 JOIN dbo.order_component_types oct ON oct.component_type_id = ct.component_type_id
                 WHERE oct.order_id = :order_id AND ct.part_number = :part_number"""),
        {"order_id": order_id, "part_number": part_number},
    ).all()

    if not rows:
        raise ValueError(f"Part number '{part_number}' was not found in this order's BUILDING_BLOCK BOM")
    if len(rows) > 1:
        raise ValueError(f"Part number '{part_number}' is ambiguous across revisions in this order")
    return rows[0][0]


def insert_device_component(
    db: Session,
    device_id: int,
    component_type_id: int,
    serial_number: str,
    part_number: str,
    component_role: Optional[str],
) -> int:
    return db.execute(
        text("""INSERT INTO dbo.device_components
                     (device_id, component_type_id, serial_number, part_number, component_role, created_at)
                 OUTPUT INSERTED.component_id
                 VALUES (:device_id, :component_type_id, :serial_number, :part_number, :component_role, SYSUTCDATETIME())"""),
        {
            "device_id": device_id,
            "component_type_id": component_type_id,
            "serial_number": serial_number,
            "part_number": part_number,
            "component_role": component_role,
        },
    ).scalar()
