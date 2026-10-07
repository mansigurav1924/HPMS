from fastapi import APIRouter
from typing import Optional
import psycopg
import random
import uuid
import json
from datetime import date
from app.config import settings

router = APIRouter(tags=["seed"])

HOSTEL_NAMES = ["Sunrise PG", "Elite Hostel", "Comfort Stay", "Student Nest", "Premium Living", "Urban PG", "Green View", "Blue Sky Hostel", "Cozy Rooms", "Royal PG"]
AREAS = ["Kothrud", "Wakad", "Hinjewadi", "Viman Nagar", "Baner", "Koregaon Park", "Aundh", "Shivaji Nagar", "Katraj", "Karve Nagar"]
CITIES = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad"]
FACILITIES = ["Wi-Fi", "AC", "Washing Machine", "Meals", "Security", "Cleaning", "Parking", "Gym"]

@router.get("/seed/100")
def seed_100_properties():
    try:
        sql_path = r"C:\Users\mgura\.gemini\antigravity-ide\brain\8b3a509b-3ed3-489d-bf94-2e3f562cfdd6\scratch\fake_data\HPMS_properties_rooms_beds_seed.sql"
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        conn = psycopg.connect(settings.DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute(sql_script)
            conn.commit()
        conn.close()
            
        return {"message": "Successfully executed the uploaded SQL seed file!"}
    except Exception as e:
        return {"error": str(e)}
