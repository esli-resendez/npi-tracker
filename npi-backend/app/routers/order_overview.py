from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import component_repository, order_repository, rack_repository, test_repository

# Order-scoped "detail view" endpoints -- separate from order_activation.py
# (which owns the DRAFT -> UNASIGNED wizard flow) since these are read-mostly
# and used by the order detail screen a user reaches once an order is ACTIVE
# (though nothing here assumes ACTIVE status, so it also works while an
# order is still in flight).
router = APIRouter(prefix="/api/orders/{order_id}", tags=["order-overview"])


@router.get("")
def get_order_overview(order_id: int, db: Session = Depends(get_db)):
    """Description tab: order fields + the CRD it was built against.
    Rack-level fields (SKU, generic name) live on dbo.racks and are fetched
    separately via GET /api/orders/{order_id}/activation/racks, since an
    order can have more than one rack."""
    summary = order_repository.get_order_summary(db, order_id)
    if summary is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return summary


@router.get("/bom/racks/{rack_id}/devices")
def get_rack_devices(order_id: int, rack_id: int, db: Session = Depends(get_db)):
    """First level of expansion in the BOM tab: devices installed on a rack."""
    return rack_repository.get_devices_for_rack(db, rack_id)


@router.get("/bom/devices/{device_id}/components")
def get_device_components_for_bom(order_id: int, device_id: int, db: Session = Depends(get_db)):
    """Second level of expansion in the BOM tab: sub-components on a device."""
    return component_repository.get_components_for_device(db, device_id)


@router.get("/test-plan")
def get_order_test_plan(order_id: int, db: Session = Depends(get_db)):
    """Test Plan tab: plan name/description, its test cases, and total
    duration_minutes summed per test_level (L10/L11 today, but works for any
    level values present in the data)."""
    plan = test_repository.get_test_plan_for_order(db, order_id)
    if plan is None:
        return {"test_plan": None, "test_cases": [], "duration_by_level": {}, "duration_by_level_process": {}}

    cases = test_repository.get_test_cases_for_plan(db, plan["test_plan_id"])

    # Nested duration rollup: level -> process -> total minutes, plus the
    # flat per-level totals already used by the UI's level summary rows.
    # Cases without a process_id yet (pre-migration / not backfilled) land
    # in "Unassigned" rather than being dropped.
    duration_by_level: dict[str, int] = {}
    duration_by_level_process: dict[str, dict[str, int]] = {}
    for case in cases:
        level = case["test_level"] or "UNSPECIFIED"
        process = case["process_name"] or "Unassigned"
        minutes = case["duration_minutes"] or 0

        duration_by_level[level] = duration_by_level.get(level, 0) + minutes
        duration_by_level_process.setdefault(level, {})
        duration_by_level_process[level][process] = duration_by_level_process[level].get(process, 0) + minutes

    return {
        "test_plan": plan,
        "test_cases": cases,
        "duration_by_level": duration_by_level,
        "duration_by_level_process": duration_by_level_process,
    }


@router.get("/log")
def get_order_log(order_id: int, db: Session = Depends(get_db)):
    """Build Log tab: placeholder until dbo.log_order (order_id, event_type,
    event_date, log_text) exists. Returns an empty list now so the frontend
    table can be built against the final shape and just needs a real query
    dropped in here later, e.g.:

        SELECT event_date, event_type, log_text FROM dbo.log_order
        WHERE order_id = :order_id ORDER BY event_date DESC
    """
    return []
