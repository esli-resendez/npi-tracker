from sqlalchemy import text
from sqlalchemy.orm import Session


def get_rack_id_for_order(db: Session, order_id: int, rack_serial: str) -> int:
    rack_id = db.execute(
        text("""SELECT r.rack_id FROM dbo.racks r
                 JOIN dbo.order_racks orck ON orck.rack_id = r.rack_id
                 WHERE orck.order_id = :order_id AND r.rack_serial = :rack_serial"""),
        {"order_id": order_id, "rack_serial": rack_serial},
    ).scalar()

    if rack_id is None:
        raise ValueError(f"Rack serial '{rack_serial}' is not linked to order {order_id}")
    return rack_id


def get_device_type_id_for_order(db: Session, order_id: int, part_number: str) -> int:
    rows = db.execute(
        text("""SELECT dt.device_type_id FROM dbo.device_types dt
                 JOIN dbo.order_device_types odt ON odt.device_type_id = dt.device_type_id
                 WHERE odt.order_id = :order_id AND dt.part_number = :part_number"""),
        {"order_id": order_id, "part_number": part_number},
    ).all()

    if not rows:
        raise ValueError(f"Part number '{part_number}' was not found in this order's RACK BOM")
    if len(rows) > 1:
        raise ValueError(f"Part number '{part_number}' is ambiguous across revisions in this order")
    return rows[0][0]


def get_devices_for_rack(db: Session, rack_id: int) -> list[dict]:
    """Powers the expandable 'BOM' tab: top-level devices installed at a
    rack's positions, with their serial/part number, the friendly
    description from device_types, and the latest test result recorded
    against them (or UNTESTED if device_process_history has no rows yet)."""
    rows = db.execute(
        text("""SELECT dar.device_id, dar.serial_number, dar.part_number,
                        rp.position, dt.description AS device_description,
                        latest.process_result AS latest_status
                 FROM dbo.devices_at_racks dar
                 JOIN dbo.rack_positions rp ON rp.rack_position_id = dar.rack_position_id
                 JOIN dbo.device_types dt ON dt.device_type_id = dar.device_type_id
                 OUTER APPLY (
                     SELECT TOP 1 dph.process_result
                     FROM dbo.device_process_history dph
                     WHERE dph.device_id = dar.device_id
                     ORDER BY dph.started_at DESC, dph.device_process_history_id DESC
                 ) latest
                 WHERE rp.rack_id = :rack_id
                 ORDER BY rp.position"""),
        {"rack_id": rack_id},
    ).mappings().all()

    results = []
    for row in rows:
        row_dict = dict(row)
        row_dict["status"] = row_dict.pop("latest_status") or "UNTESTED"
        results.append(row_dict)
    return results


def insert_rack_position(db: Session, rack_id: int, position: int, device_type_id: int) -> int:
    return db.execute(
        text("""INSERT INTO dbo.rack_positions (rack_id, position, device_type_id)
                 OUTPUT INSERTED.rack_position_id
                 VALUES (:rack_id, :position, :device_type_id)"""),
        {"rack_id": rack_id, "position": position, "device_type_id": device_type_id},
    ).scalar()


def insert_device_at_rack(db: Session, rack_position_id: int, device_type_id: int, part_number: str, serial_number: str) -> int:
    device_id = db.execute(
        text("""INSERT INTO dbo.devices_at_racks (rack_position_id, device_type_id, part_number, serial_number, created_at)
                 OUTPUT INSERTED.device_id
                 VALUES (:rack_position_id, :device_type_id, :part_number, :serial_number, SYSUTCDATETIME())"""),
        {
            "rack_position_id": rack_position_id,
            "device_type_id": device_type_id,
            "part_number": part_number,
            "serial_number": serial_number,
        },
    ).scalar()

    db.execute(
        text("UPDATE dbo.rack_positions SET device_id = :device_id WHERE rack_position_id = :rack_position_id"),
        {"device_id": device_id, "rack_position_id": rack_position_id},
    )
    return device_id
