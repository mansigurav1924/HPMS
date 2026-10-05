from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from .config import settings
from .core.rate_limit import limiter
from .routers import auth, users, students, owners, admin, properties, rooms, colleges, wishlist, bookings, tenancies, payments, rent_dues, complaints, notices, reviews, notifications

app = FastAPI(title="HPMS API", version="3.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)

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
from app.routers import dashboards, search, exports, data_access

app.include_router(notices.router)
app.include_router(reviews.router)
app.include_router(notifications.router)
app.include_router(dashboards.router)
app.include_router(search.router)
app.include_router(exports.router)
app.include_router(data_access.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.ENV, "phase": "7"}
