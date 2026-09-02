from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import test_repository
from app.services.blob_storage import blob_storage_service
from app.services.excel_parser import parse_rows

router = APIRouter(prefix="/api/test-plans", tags=["test-plans"])
TEST_PLAN_HEADERS = ["order", "test_name", "test_description", "test_level", "duration"]


@router.post("/{test_plan_id}/cases")
async def upload_test_plan_cases(
    test_plan_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    blob_storage_service.upload(test_plan_id, "test-plan-cases", file.filename, content)
    already_linked_ids = test_repository.get_linked_case_ids(db, test_plan_id)
    created, linked, already_linked, level_mismatches, errors = [], [], [], [], []

    try:
        for i, row in enumerate(parse_rows(content, TEST_PLAN_HEADERS), start=2):
            try:
                test_name = str(row["test_name"]).strip()
                test_level = str(row["test_level"]).strip().upper()
                test_description = str(row["test_description"]).strip() if row["test_description"] else None
                duration = int(row["duration"]) if row["duration"] not in (None, "") else None
                sequence = int(row["order"]) if row["order"] not in (None, "") else None

                existing = test_repository.get_test_case_by_name(db, test_name)

                if existing is None:
                    # Check 1: case doesn't exist yet -- create it
                    test_case_id = test_repository.create_test_case(
                        db, test_name, test_description, test_level, duration
                    )
                    created.append({"row": i, "test_name": test_name, "test_case_id": test_case_id})
                else:
                    test_case_id = existing["test_case_id"]
                    if existing["test_level"] != test_level:
                        # Same name, different level -- flag rather than silently overwrite
                        level_mismatches.append({
                            "row": i,
                            "test_name": test_name,
                            "existing_level": existing["test_level"],
                            "file_level": test_level,
                        })
                        continue

                # Check 2: is this case already linked to the target plan?
                if test_case_id in already_linked_ids:
                    already_linked.append({"row": i, "test_name": test_name, "test_case_id": test_case_id})
                else:
                    test_repository.link_case_to_plan(db, test_plan_id, test_case_id, sequence)
                    already_linked_ids.add(test_case_id)
                    linked.append({"row": i, "test_name": test_name, "test_case_id": test_case_id})

            except Exception as e:
                errors.append({"row": i, "error": str(e)})
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

    if errors or level_mismatches:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail={
                "created": len(created),
                "linked": len(linked),
                "already_linked": len(already_linked),
                "level_mismatches": level_mismatches,
                "errors": errors,
            },
        )

    db.commit()
    return {
        "test_plan_id": test_plan_id,
        "created": created,
        "linked": linked,
        "already_linked": already_linked,
    }

@router.post("/{test_plan_id}/assign/{order_id}")
def assign_test_plan(test_plan_id: int, order_id: int, db: Session = Depends(get_db)):
    try:
        test_repository.assign_plan_to_order(db, order_id, test_plan_id)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to assign test plan: {e}")

    return {"order_id": order_id, "test_plan_id": test_plan_id}