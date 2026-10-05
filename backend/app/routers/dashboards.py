from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
import psycopg
from app.db.session import get_db_connection
from app.db.session import require_role, get_uid

router = APIRouter(prefix="/dashboard", tags=["dashboards"])

@router.get("/owner")
def get_owner_dashboard(
    request: Request,
    property_id: Optional[str] = None,
    db: psycopg.Connection = Depends(get_db_connection)
):
    claims = require_role(request, "owner")
    uid = get_uid(claims)
    with db.cursor() as cur:
        query = "SELECT * FROM owner_dashboard_stats WHERE owner_id = %s"
        params = [uid]
        if property_id:
            query += " AND property_id = %s"
            params.append(property_id)
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        if not rows and property_id:
            raise HTTPException(status_code=404, detail="Property not found or access denied")
        
        columns = [desc[0] for desc in cur.description]
        stats = [dict(zip(columns, row)) for row in rows]
        
        return {"data": stats}

@router.get("/admin")
def get_admin_dashboard(
    request: Request,
    db: psycopg.Connection = Depends(get_db_connection)
):
    require_role(request, "admin")
    with db.cursor() as cur:
        cur.execute("SELECT * FROM admin_dashboard_stats WHERE id = 1")
        row = cur.fetchone()
        if not row:
            return {"data": {}}
        columns = [desc[0] for desc in cur.description]
        return {"data": dict(zip(columns, row))}

@router.get("/student")
def get_student_dashboard(
    request: Request,
    db: psycopg.Connection = Depends(get_db_connection)
):
    # Student dashboard stats (active tenancies, open complaints, notices, unread notifications)
    claims = require_role(request, "student")
    uid = get_uid(claims)
    with db.cursor() as cur:
        # active tenancy
        cur.execute("""
            SELECT t.tenancy_id, t.property_id, p.name as property_name, t.status 
            FROM tenancies t JOIN properties p ON t.property_id = p.property_id
            WHERE t.student_id = %s AND t.status IN ('active', 'notice')
        """, (uid,))
        tenancies = cur.fetchall()
        
        # open complaints
        cur.execute("SELECT COUNT(*) FROM complaints WHERE student_id = %s AND status NOT IN ('Resolved', 'Closed')", (uid,))
        open_complaints = cur.fetchone()[0]
        
        # unread notifications
        cur.execute("SELECT COUNT(*) FROM notifications WHERE user_id = %s AND read_at IS NULL", (uid,))
        unread_notifications = cur.fetchone()[0]
        
        # latest notices for their active property
        notices = []
        if tenancies:
            cur.execute("""
                SELECT n.notice_id, n.title, n.posted_at
                FROM notices n
                WHERE n.property_id = %s AND n.expires_at > now()
                ORDER BY n.posted_at DESC LIMIT 3
            """, (tenancies[0][1],))
            columns = [desc[0] for desc in cur.description]
            notices = [dict(zip(columns, row)) for row in cur.fetchall()]
            
        return {
            "data": {
                "active_tenancies": [{"tenancy_id": t[0], "property_name": t[2], "status": t[3]} for t in tenancies],
                "open_complaints": open_complaints,
                "unread_notifications": unread_notifications,
                "latest_notices": notices
            }
        }

@router.post("/refresh")
def refresh_dashboards(
    request: Request,
    db: psycopg.Connection = Depends(get_db_connection)
):
    require_role(request, "admin")
    # Note: normally Celery beat refreshes this every 15 min. This is a manual trigger.
    with db.cursor() as cur:
        cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY owner_dashboard_stats")
        cur.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats")
    db.commit()
    return {"status": "success", "message": "Dashboards refreshed"}
