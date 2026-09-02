from typing import List
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session


# --- Request models, mirroring your BuildData TS interfaces ---

class OrderDetailsIn(BaseModel):
    user: str
    buildId: str          # not persisted -- schema has no matching column
    rackSku: str
    rackGenName: str
    buildingBlock: str
    crdNumber: str
    crdRevision: str
    buildStage: str
    rackQty: int

class RackIn(BaseModel):
    rackSerial: str

class AssignedUsers(BaseModel):
    user_email: str

class BuildDataIn(BaseModel):
    orderDetails: OrderDetailsIn
    racks: List[RackIn]
    team: list[AssignedUsers]


class DataOperationsNewOrder:
    def __init__(self):
        pass

    def get_or_create_crd(self, db: Session, crd_number: str) -> int:
        existing = db.execute(
            text("SELECT crd_id FROM crds WHERE crd_number = :crd_number"),
            {"crd_number": crd_number}
        ).scalar()

        if existing is not None:
            return existing

        return db.execute(
            text("""
                INSERT INTO crds (crd_number)
                OUTPUT INSERTED.crd_id
                VALUES (:crd_number)
            """),
            {"crd_number": crd_number}
        ).scalar()

    def get_or_create_crd_version(self, db: Session, crd_id: int, crd_revision: str) -> int:
        existing = db.execute(
            text("""
                SELECT crd_version_id FROM crd_versions
                WHERE crd_id = :crd_id AND crd_revision = :crd_revision
            """),
            {"crd_id": crd_id, "crd_revision": crd_revision}
        ).scalar()

        if existing is not None:
            return existing

        return db.execute(
            text("""
                INSERT INTO crd_versions (crd_id, crd_revision)
                OUTPUT INSERTED.crd_version_id
                VALUES (:crd_id, :crd_revision)
            """),
            {"crd_id": crd_id, "crd_revision": crd_revision}
        ).scalar()

    def get_or_create_building_block(self, db: Session, building_block: str) -> int:
        existing = db.execute(
            text("SELECT bb_id FROM building_blocks WHERE building_block = :building_block"),
            {"building_block": building_block}
        ).scalar()

        if existing is not None:
            return existing

        return db.execute(
            text("""
                INSERT INTO building_blocks (building_block)
                OUTPUT INSERTED.bb_id
                VALUES (:building_block)
            """),
            {"building_block": building_block}
        ).scalar()

    def create_order(self, db: Session, crd_version_id: int, stage: str, bb_id: int) -> int:
        # Order status is draft because the BOM must be defined
        order_id = db.execute(
            text("""
                INSERT INTO orders (stage, crd_version_id, ord_status, bb_id)
                OUTPUT INSERTED.order_id
                VALUES (:stage, :crd_version_id, 'DRAFT', :bb_id)
            """),
            {"stage": stage, "crd_version_id": crd_version_id, "bb_id": bb_id}
        ).scalar()

        # order_number is UNIQUE, so the 'TEMP' default only holds for one row --
        # replace it now that we have a real order_id to build a number from.
        order_number = f"ORD-{order_id:06d}"

        db.execute(
            text("UPDATE orders SET order_number = :order_number WHERE order_id = :order_id"),
            {"order_number": order_number, "order_id": order_id}
        )

        return order_id

    def create_rack(self, db: Session, rack_sku: str, rack_gen_name: str, rack_serial: str) -> int:
        return db.execute(
            text("""
                INSERT INTO racks (rack_sku, rack_gen_name, rack_serial)
                OUTPUT INSERTED.rack_id
                VALUES (:rack_sku, :rack_gen_name, :rack_serial)
            """),
            {
                "rack_sku": rack_sku,
                "rack_gen_name": rack_gen_name,
                "rack_serial": rack_serial
            }
        ).scalar()

    def link_rack_to_order(self, db: Session, order_id: int, rack_id: int, sequence: int) -> None:
        db.execute(
            text("""
                INSERT INTO order_racks (order_id, rack_id, rack_sequence)
                VALUES (:order_id, :rack_id, :sequence)
            """),
            {"order_id": order_id, "rack_id": rack_id, "sequence": sequence}
        )

    def get_or_create_user(self, db: Session, email: str) -> int:
        """Looks up a user by email. Creates one (using email as username,
        since that's all the frontend gives us) if none exists yet."""
        normalized_email = email.strip().lower()

        existing = db.execute(
            text("SELECT user_id FROM users WHERE email = :email"),
            {"email": normalized_email}
        ).scalar()

        if existing is not None:
            return existing

        return db.execute(
            text("""
                INSERT INTO users (username, email)
                OUTPUT INSERTED.user_id
                VALUES (:username, :email)
            """),
            {"username": normalized_email, "email": normalized_email}
        ).scalar()

    def get_role_id(self, db: Session, role_name: str) -> int:
        """Looks up a role by name. Roles are treated as pre-seeded lookup
        data, so this raises rather than silently creating a new role row --
        adjust the role_name strings passed in to match your actual seed data."""
        role_id = db.execute(
            text("SELECT role_id FROM roles WHERE role_name = :role_name"),
            {"role_name": role_name}
        ).scalar()

        if role_id is None:
            raise HTTPException(
                status_code=500,
                detail=f"Role '{role_name}' is not configured in the roles table."
            )

        return role_id

    def link_user_to_order(self, db: Session, order_id: int, user_id: int, role_id: int) -> None:
        db.execute(
            text("""
                INSERT INTO order_users (order_id, user_id, role_id)
                VALUES (:order_id, :user_id, :role_id)
            """),
            {"order_id": order_id, "user_id": user_id, "role_id": role_id}
        )

    def save_new_order(self, db: Session, build_data: BuildDataIn) -> int:
        order_details = build_data.orderDetails

        if order_details.rackQty != len(build_data.racks):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"rackQty ({order_details.rackQty}) does not match "
                    f"number of racks submitted ({len(build_data.racks)})"
                )
            )

        try:
            crd_id = self.get_or_create_crd(db, order_details.crdNumber)
            crd_version_id = self.get_or_create_crd_version(
                db, crd_id, order_details.crdRevision
            )
            bb_id = self.get_or_create_building_block(db, order_details.buildingBlock)
            order_id = self.create_order(db, crd_version_id, order_details.buildStage, bb_id)

            for sequence, rack in enumerate(build_data.racks, start=1):
                rack_id = self.create_rack(
                    db,
                    order_details.rackSku,
                    order_details.rackGenName,
                    rack.rackSerial
                )
                self.link_rack_to_order(db, order_id, rack_id, sequence)

            # Creator of the order receives role as Author
            owner_role_id = self.get_role_id(db, "AUTHOR")
            owner_user_id = self.get_or_create_user(db, order_details.user)
            self.link_user_to_order(db, order_id, owner_user_id, owner_role_id)

            linked_user_ids = {owner_user_id}

            # Assign by default as VTeam Member
            if build_data.team:
                member_role_id = self.get_role_id(db, "V-TEAM")

                for member in build_data.team:
                    member_user_id = self.get_or_create_user(db, member.user_email)

                    if member_user_id in linked_user_ids:
                        # Already linked (e.g. creator also listed as a team member)
                        continue

                    self.link_user_to_order(db, order_id, member_user_id, member_role_id)
                    linked_user_ids.add(member_user_id)

            db.commit()

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            print(f"Exception raised: {e}")
            db.rollback()
            raise HTTPException(status_code=601, detail="Failed to create build")

        return order_id