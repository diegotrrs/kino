from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import events_router

app = FastAPI(
    title="Kino API",
    description="Backend API for the Kino application",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events_router, prefix="/api/events", tags=["events"])


@app.get("/")
async def root():
    return {"message": "Welcome to Kino API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
