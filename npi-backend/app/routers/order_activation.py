from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import catalog_repository, component_repository, order_repository, rack_repository
from app.services.blob_storage import blob_storage_service
from app.services.excel_parser import parse_rows

router = APIRouter(prefix="/api/orders/{order_id}/activation", tags=["order-activation"])

BOM_HEADERS = ["part_number", "revision", "description", "class"]
RACK_SERIAL_HEADERS = ["rack_sn", "device_sn", "device_part_number", "rack_position"]
COMPONENT_SERIAL_HEADERS = ["device_sn", "component_sn", "component_part_number", "component_role"]


@router.get("/racks")
def get_racks(order_id: int, db: Session = Depends(get_db)):
    return order_repository.get_order_racks(db, order_id)


@router.post("/rack-bom")
async def upload_rack_bom(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    blob_storage_service.upload(order_id, "rack-bom", file.filename, content)

    processed, errors = [], []
    try:
        for i, row in enumerate(parse_rows(content, BOM_HEADERS), start=2):
            try:
                dt_id = catalog_repository.upsert_device_type(
                    db,
                    part_number=str(row["part_number"]).strip(),
                    revision=str(row["revision"]).strip(),
                    description=str(row["description"]).strip(),
                    cls=str(row["class"]).strip() if row["class"] else None,
                )
                catalog_repository.link_order_device_type(db, order_id, dt_id)
                processed.append({"row": i, "device_type_id": dt_id})
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

    if errors:
        db.rollback()
        raise HTTPException(status_code=422, detail={"processed": len(processed), "errors": errors})

    db.commit()
    return {"processed": len(processed)}


@router.post("/building-block-bom")
async def upload_building_block_bom(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    blob_storage_service.upload(order_id, "building-block-bom", file.filename, content)

    processed, errors = [], []
    try:
        for i, row in enumerate(parse_rows(content, BOM_HEADERS), start=2):
            try:
                ct_id = catalog_repository.upsert_component_type(
                    db,
                    part_number=str(row["part_number"]).strip(),
                    revision=str(row["revision"]).strip(),
                    description=str(row["description"]).strip(),
                    cls=str(row["class"]).strip() if row["class"] else None,
                )
                catalog_repository.link_order_component_type(db, order_id, ct_id)
                processed.append({"row": i, "component_type_id": ct_id})
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

    if errors:
        db.rollback()
        raise HTTPException(status_code=422, detail={"processed": len(processed), "errors": errors})

    db.commit()
    return {"processed": len(processed)}


@router.post("/rack-serials")
async def upload_rack_serials(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    blob_storage_service.upload(order_id, "rack-serials", file.filename, content)

    processed, errors = [], []
    try:
        for i, row in enumerate(parse_rows(content, RACK_SERIAL_HEADERS), start=2):
            try:
                rack_id = rack_repository.get_rack_id_for_order(db, order_id, str(row["rack_sn"]).strip())
                dt_id = rack_repository.get_device_type_id_for_order(db, order_id, str(row["device_part_number"]).strip())
                rp_id = rack_repository.insert_rack_position(db, rack_id, int(row["rack_position"]), dt_id)
                device_id = rack_repository.insert_device_at_rack(
                    db, rp_id, dt_id, str(row["device_part_number"]).strip(), str(row["device_sn"]).strip()
                )
                processed.append({"row": i, "device_id": device_id})
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

    if errors:
        db.rollback()
        raise HTTPException(status_code=422, detail={"processed": len(processed), "errors": errors})

    db.commit()
    return {"processed": len(processed)}


@router.post("/component-serials")
async def upload_component_serials(order_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    blob_storage_service.upload(order_id, "component-serials", file.filename, content)

    processed, errors = [], []
    try:
        for i, row in enumerate(parse_rows(content, COMPONENT_SERIAL_HEADERS), start=2):
            try:
                device_id = component_repository.get_device_id_for_order(db, order_id, str(row["device_sn"]).strip())
                ct_id = component_repository.get_component_type_id_for_order(
                    db, order_id, str(row["component_part_number"]).strip()
                )
                component_id = component_repository.insert_device_component(
                    db,
                    device_id,
                    ct_id,
                    str(row["component_sn"]).strip(),
                    str(row["component_part_number"]).strip(),
                    str(row["component_role"]).strip() if row["component_role"] else None,
                )
                processed.append({"row": i, "component_id": component_id})
            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

    if errors:
        db.rollback()
        raise HTTPException(status_code=422, detail={"processed": len(processed), "errors": errors})

    db.commit()
    return {"processed": len(processed)}


class StartDateRequest(BaseModel):
    start_date: date


@router.post("/start")
def start_order(order_id: int, body: StartDateRequest, db: Session = Depends(get_db)):
    try:
        order_repository.activate_order(db, order_id, body.start_date)
        db.commit()
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(e))
    return {"order_id": order_id, "ord_status": "ACTIVE", "start_date": body.start_date}
