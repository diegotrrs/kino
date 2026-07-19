from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth_router, calendars_router, events_router, feedback_router, users_router, wishlist_router

app = FastAPI(
    title="Kino API",
    description="Backend API for the Kino application",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(calendars_router, prefix="/api/calendars", tags=["calendars"])
app.include_router(events_router, prefix="/api/events", tags=["events"])
app.include_router(feedback_router, prefix="/api/feedback", tags=["feedback"])
app.include_router(wishlist_router, prefix="/api/wishlist", tags=["wishlist"])

if get_settings().env != "production":
    from .routers.test import router as test_router
    app.include_router(test_router, prefix="/api/test", tags=["test"])


@app.get("/")
async def root():
    return {"message": "Welcome to Kino API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
