"""
Colleges router — public read-only.
"""
from fastapi import APIRouter, Depends
import psycopg
from ..db.session import get_public_db_connection

router = APIRouter(prefix="/colleges", tags=["colleges"])


@router.get("")
def list_colleges(
    city: str = None,
    conn: psycopg.Connection = Depends(get_public_db_connection),
):
    with conn.cursor() as cur:
        if city:
            cur.execute(
                "SELECT college_id, name, city, latitude, longitude FROM colleges WHERE lower(city) = lower(%s) ORDER BY name",
                (city,)
            )
        else:
            cur.execute(
                "SELECT college_id, name, city, latitude, longitude FROM colleges ORDER BY city, name"
            )
        cols = [d.name for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]
