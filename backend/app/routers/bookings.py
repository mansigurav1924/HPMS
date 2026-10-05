from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import date
import psycopg
import json

from ..db.session import get_db_connection, require_role, get_uid
from ..services.audit import log_action
from ..services.notifications import send_notification
from ..core.rate_limit import limiter
from ..config import settings
from ..services.razorpay_service import razorpay_service
from psycopg.rows import dict_row

router = APIRouter(prefix="/bookings", tags=["bookings"])

class BookingRequest(BaseModel):
    bed_id: str
    move_in_date: date
    duration_months: int

class BookingResponse(BaseModel):
    approve: bool
    reason: Optional[str] = None

class BookingCancel(BaseModel):
    reason: str

class AdvancePayment(BaseModel):
    amount: float
    mode: str
    reference_no: str

from ..core.rate_limit import limiter

@router.post("/request")
@limiter.limit("5/minute")
def create_booking(req: Request, data: BookingRequest):
    conn = get_db_connection(request)
    student_id = require_role(req, "student")
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT create_booking_request(%s, %s, %s, %s)
            """, (student_id, data.bed_id, data.move_in_date, data.duration_months))
            booking_id = cur.fetchone()[0]
            
            cur.execute("""
                SELECT b.booking_id, p.owner_id, u.email, u.name, p.name
                FROM bookings b
                JOIN properties p ON b.property_id = p.property_id
                JOIN users u ON p.owner_id = u.user_id
                WHERE b.booking_id = %s
            """, (booking_id,))
            b_row = cur.fetchone()
            if b_row:
                owner_id, owner_email, owner_name, prop_name = b_row[1], b_row[2], b_row[3], b_row[4]
                send_notification(conn, owner_id, "booking_request_received", owner_email, {
                    "owner_name": owner_name, "property_name": prop_name
                }, "New Booking Request")
            
            log_action(conn, student_id, "student", "CREATE_BOOKING_REQUEST", "bookings", str(booking_id), 
                       json.dumps({"bed_id": data.bed_id, "move_in_date": str(data.move_in_date), "duration_months": data.duration_months}))
            conn.commit()
            return {"status": "success", "booking_id": booking_id}
    except psycopg.errors.RaiseException as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{booking_id}/respond")
def respond_booking(req: Request, booking_id: str, data: BookingResponse):
    conn = get_db_connection(request)
    owner_id = require_role(req, "owner")
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT respond_to_booking(%s, %s, %s, %s)
            """, (booking_id, owner_id, data.approve, data.reason))
            
            cur.execute("""
                SELECT b.student_id, u.email, u.name, p.name
                FROM bookings b
                JOIN properties p ON b.property_id = p.property_id
                JOIN users u ON b.student_id = u.user_id
                WHERE b.booking_id = %s
            """, (booking_id,))
            b_row = cur.fetchone()
            if b_row:
                s_id, s_email, s_name, prop_name = b_row[0], b_row[1], b_row[2], b_row[3]
                template = "booking_approved" if data.approve else "booking_rejected"
                subject = "Booking Approved!" if data.approve else "Booking Rejected"
                send_notification(conn, s_id, template, s_email, {
                    "student_name": s_name, "property_name": prop_name, "reason": data.reason or ""
                }, subject)
                
            log_action(conn, owner_id, "owner", "RESPOND_BOOKING", "bookings", booking_id, 
                       json.dumps({"approve": data.approve, "reason": data.reason}))
            conn.commit()
            return {"status": "success", "message": "Booking responded"}
    except psycopg.errors.RaiseException as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{booking_id}/cancel")
def cancel_booking_endpoint(req: Request, booking_id: str, data: BookingCancel):
    conn = get_db_connection(request)
    uid = get_uid(req) # Can be student or owner
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT cancel_booking(%s, %s, %s)
            """, (booking_id, uid, data.reason))
            
            log_action(conn, uid, "user", "CANCEL_BOOKING", "bookings", booking_id, 
                       json.dumps({"reason": data.reason}))
            conn.commit()
            return {"status": "success", "message": "Booking cancelled"}
    except psycopg.errors.RaiseException as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{booking_id}/advance")
def record_advance(req: Request, booking_id: str, data: AdvancePayment):
    conn = get_db_connection(request)
    owner_id = require_role(req, "owner")
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT record_offline_advance(%s, %s, %s, %s, %s)
            """, (booking_id, owner_id, data.amount, data.mode, data.reference_no))
            
            log_action(conn, owner_id, "owner", "RECORD_ADVANCE", "bookings", booking_id, 
                       json.dumps({"amount": data.amount, "mode": data.mode, "reference_no": data.reference_no}))
            conn.commit()
            return {"status": "success", "message": "Advance payment recorded, booking confirmed"}
    except psycopg.errors.RaiseException as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/expire-holds")
def expire_holds(req: Request):
    conn = get_db_connection(request)
    admin_id = require_role(req, "admin")
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT expire_overdue_holds()")
            count = cur.fetchone()[0]
            
            log_action(conn, admin_id, "admin", "EXPIRE_HOLDS", "bookings", None, json.dumps({"count": count}))
            conn.commit()
            return {"status": "success", "expired_count": count}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── pay_booking endpoint commented out (payment feature paused) ──────────────
# class PayResponse(BaseModel):
#     order_id: str
#     amount: int
#     currency: str
#     key_id: str
#
# @router.post("/{booking_id}/pay", response_model=PayResponse)
# @limiter.limit("5/minute")
# def pay_booking(request: Request, booking_id: str):
#     conn = get_db_connection(request)
#     uid = require_role(request, "student")
#
#     try:
#         with conn.cursor(row_factory=dict_row) as cur:
#             cur.execute("""
#                 SELECT b.status, b.rent_amount, b.deposit_amount, p.name as prop_name
#                 FROM bookings b
#                 JOIN properties p ON b.property_id = p.property_id
#                 WHERE b.booking_id = %s AND b.student_id = %s
#             """, (booking_id, uid))
#             booking = cur.fetchone()
#             if not booking:
#                 raise HTTPException(status_code=404, detail="Booking not found")
#             if booking['status'] != 'payment_pending':
#                 raise HTTPException(status_code=400, detail="Booking is not pending payment")
#
#             total_amount = float(booking['rent_amount'] + (booking['deposit_amount'] or 0))
#
#             cur.execute("""
#                 SELECT gateway_order_id, amount FROM payments
#                 WHERE booking_id = %s AND type = 'booking_advance' AND status = 'Pending'
#             """, (booking_id,))
#             existing_payment = cur.fetchone()
#             if existing_payment and existing_payment['gateway_order_id']:
#                 return {
#                     "order_id": existing_payment['gateway_order_id'],
#                     "amount": int(existing_payment['amount'] * 100),
#                     "currency": "INR",
#                     "key_id": settings.RAZORPAY_KEY_ID
#                 }
#
#             # --- AUTO CONFIRM BYPASS ---
#             cur.execute("""
#                 INSERT INTO payments(booking_id, payer_id, amount, type, mode, gateway_order_id, status)
#                 VALUES (%s, %s, %s, 'booking_advance', 'online', %s, 'Pending')
#                 RETURNING payment_id
#             """, (booking_id, uid, total_amount, f"MOCK_ORDER_{booking_id[:8]}"))
#             new_payment = cur.fetchone()
#             cur.execute("SELECT apply_successful_payment(%s, %s, now())",
#                         (new_payment['payment_id'], f"MOCK_PAY_{booking_id[:8]}"))
#
#             conn.commit()
#             return {
#                 "order_id": f"MOCK_ORDER_{booking_id[:8]}",
#                 "amount": int(total_amount * 100),
#                 "currency": "INR",
#                 "key_id": "mock_key"
#             }
#     except HTTPException:
#         raise
#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
# ─────────────────────────────────────────────────────────────────────────────
