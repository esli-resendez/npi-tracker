from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.data_operations import DataOperationsNewOrder, BuildDataIn
from app.routers import builds, order_activation, team_assignment


app = FastAPI(title="NPI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server default
        "http://localhost:3000",  # CRA dev server default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(builds.router)
app.include_router(order_activation.router)
app.include_router(team_assignment.router)

data_ops = DataOperationsNewOrder()


@app.get("/")
def root():
    return {"message": "NPI Backend is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/database")
def database_health():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        value = result.scalar()

    return {
        "database": "ok",
        "result": value
    }

@app.get("/api/orders/my-active")
def get_my_active_orders(
    username: str,
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            o.order_id,
            o.order_number,
            o.ord_status
        FROM orders o
        INNER JOIN order_users ou
            ON o.order_id = ou.order_id
        INNER JOIN users u
            ON ou.user_id = u.user_id
        WHERE
            u.username = :username
    """)

    result = db.execute(
        query,
        {"username": username}
    )

    orders = result.mappings().all()

    return orders

@app.post("/api/builds")
def create_build(build_data: BuildDataIn, db: Session = Depends(get_db)):
    order_id = data_ops.save_new_order(db, build_data)
    return {"orderId": order_id}