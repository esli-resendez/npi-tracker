from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import process_event_repository

router = APIRouter(prefix="/api/process-events", tags=["process-events"])

VALID_RESULTS = {"PASS", "FAIL"}


class ProcessEventIn(BaseModel):
    serial_number: str
    process_name: str
    result: str


@router.post("")
def report_process_event(body: ProcessEventIn, db: Session = Depends(get_db)):
    """Inbound feed from an external test system. The caller only knows a
    serial number -- it has no concept of our order/rack/device ids -- so
    this endpoint resolves the serial itself and:

    - If the serial matches neither a rack nor a device, the event is
      silently ignored (not an error): we're simply not tracking that
      serial, which is an expected/routine case for this feed rather than
      something the caller did wrong.
    - The external system is the source of truth for which processes
      exist, so an unrecognized process_name is created in dbo.processes
      rather than rejected.
    - Each call appends a new history row (rack_process_history or
      device_process_history); the BOM view always reads the most recent
      one, so a serial can be reported on repeatedly as it moves through
      the flow and the UI just reflects the latest state.
    """
    serial_number = body.serial_number.strip()
    process_name = body.process_name.strip()
    result = body.result.strip().upper()

    if not serial_number or not process_name:
        raise HTTPException(status_code=422, detail="serial_number and process_name are required")
    if result not in VALID_RESULTS:
        raise HTTPException(status_code=422, detail=f"result must be one of {sorted(VALID_RESULTS)}")

    try:
        rack_id = process_event_repository.find_rack_id_by_serial(db, serial_number)
        if rack_id is not None:
            process_id = process_event_repository.get_or_create_process(db, process_name)
            process_event_repository.record_rack_process_result(db, rack_id, process_id, result)
            db.commit()
            return {"status": "recorded", "entity": "rack", "serial_number": serial_number, "result": result}

        device_id = process_event_repository.find_device_id_by_serial(db, serial_number)
        if device_id is not None:
            process_id = process_event_repository.get_or_create_process(db, process_name)
            process_event_repository.record_device_process_result(db, device_id, process_id, result)
            db.commit()
            return {"status": "recorded", "entity": "device", "serial_number": serial_number, "result": result}

        return {"status": "ignored", "reason": "serial_number not tracked", "serial_number": serial_number}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Exception raised: {e}")
        raise HTTPException(status_code=500, detail="Failed to record process event")
