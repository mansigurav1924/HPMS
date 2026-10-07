from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from .config import settings
from .core.rate_limit import limiter
from .routers import auth, users, students, owners, admin, properties, rooms, colleges, wishlist, bookings, tenancies, payments, rent_dues, complaints, notices, reviews, notifications, maps

app = FastAPI(title="HPMS API", version="3.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)



from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; "
            "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com; "
            "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com;"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(students.router)
app.include_router(owners.router)
app.include_router(admin.router)
# app.include_router(payments.router)
app.include_router(rent_dues.router)
app.include_router(properties.router)
app.include_router(rooms.router)
app.include_router(colleges.router)
app.include_router(wishlist.router)
app.include_router(bookings.router)
app.include_router(tenancies.router)
app.include_router(complaints.router)
from app.routers import dashboards, search, exports, data_access, seed

app.include_router(notices.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(dashboards.router)
app.include_router(search.router)
app.include_router(exports.router)
app.include_router(data_access.router)
app.include_router(seed.router)
app.include_router(maps.router)

@app.get("/health")
def health_check():
    db_status = "ok"
    db_error = None
    try:
        import psycopg
        conn = psycopg.connect(settings.DATABASE_URL, connect_timeout=5)
        conn.close()
    except Exception as e:
        db_status = "error"
        db_error = str(e)
    return {"status": "ok", "env": settings.ENV, "phase": "12", "db_status": db_status, "db_error": db_error}

@app.get("/test-db")
def test_db():
    import psycopg
    results = {}
    url = "postgresql://postgres.oppfiozbafwxepryueht:N8%25v%40%26UDvK232gb@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require"
    try:
        c = psycopg.connect(url, connect_timeout=3)
        with c.cursor() as cur:
            cur.execute("SELECT owner_id FROM owner_profiles;")
            results["owner_profiles"] = [r[0] for r in cur.fetchall()]
            
            cur.execute("SELECT DISTINCT owner_id FROM properties;")
            results["properties"] = [r[0] for r in cur.fetchall()]
        c.close()
    except Exception as e:
        results["error"] = str(e)
    return results
