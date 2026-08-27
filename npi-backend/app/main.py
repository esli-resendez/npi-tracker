from fastapi import FastAPI
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import engine

app = FastAPI(title="NPI Backend")


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
            o.status
        FROM orders o
        INNER JOIN order_users ou
            ON o.order_id = ou.order_id
        INNER JOIN users u
            ON ou.user_id = u.user_id
        WHERE
            u.username = :username
            AND o.status = 'ACTIVE'
    """)

    result = db.execute(
        query,
        {"username": username}
    )

    orders = result.mappings().all()

    return orders