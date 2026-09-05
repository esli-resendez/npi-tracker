from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


def find_rack_id_by_serial(db: Session, serial_number: str) -> Optional[int]:
    return db.execute(
        text("SELECT rack_id FROM dbo.racks WHERE rack_serial = :serial_number"),
        {"serial_number": serial_number},
    ).scalar()


def find_device_id_by_serial(db: Session, serial_number: str) -> Optional[int]:
    return db.execute(
        text("SELECT device_id FROM dbo.devices_at_racks WHERE serial_number = :serial_number"),
        {"serial_number": serial_number},
    ).scalar()


def get_or_create_process(db: Session, process_name: str) -> int:
    """The external test system is the source of truth for which processes
    exist. If dbo.processes doesn't already have this process_name, create
    it here rather than rejecting the event."""
    existing = db.execute(
        text("SELECT process_id FROM dbo.processes WHERE process_name = :process_name"),
        {"process_name": process_name},
    ).scalar()

    if existing is not None:
        return existing

    return db.execute(
        text("""INSERT INTO dbo.processes (process_name, is_active)
                 OUTPUT INSERTED.process_id
                 VALUES (:process_name, 1)"""),
        {"process_name": process_name},
    ).scalar()


def record_rack_process_result(db: Session, rack_id: int, process_id: int, result: str) -> int:
    # started_at/ended_at are both "now" -- the external system is reporting
    # a completed result, not the start of an in-progress process.
    return db.execute(
        text("""INSERT INTO dbo.rack_process_history
                     (rack_id, process_id, started_at, ended_at, reported_by, process_result)
                 OUTPUT INSERTED.rack_process_history_id
                 VALUES (:rack_id, :process_id, SYSUTCDATETIME(), SYSUTCDATETIME(), 'EXTERNAL', :result)"""),
        {"rack_id": rack_id, "process_id": process_id, "result": result},
    ).scalar()


def record_device_process_result(db: Session, device_id: int, process_id: int, result: str) -> int:
    return db.execute(
        text("""INSERT INTO dbo.device_process_history
                     (device_id, process_id, started_at, ended_at, reported_by, process_result)
                 OUTPUT INSERTED.device_process_history_id
                 VALUES (:device_id, :process_id, SYSUTCDATETIME(), SYSUTCDATETIME(), 'EXTERNAL', :result)"""),
        {"device_id": device_id, "process_id": process_id, "result": result},
    ).scalar()
