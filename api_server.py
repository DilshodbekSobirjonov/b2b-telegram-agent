"""
FastAPI Admin API Server for B2B Telegram Agent.
Run with: python api_server.py
or: uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
"""
import sys
import os

# Ensure project root is in path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Database setup
from database.repository import Repository, engine
from database.models import Base
from database.admin_users import AdminUser, seed_default_users
from sqlalchemy.orm import sessionmaker

# API Routers
from api.auth import router as auth_router
from api.dashboard import router as dashboard_router
from api.businesses import router as businesses_router
from api.bookings import router as bookings_router
from api.clients import router as clients_router
from api.conversations import router as conversations_router
from api.ai_providers import router as ai_providers_router

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Seed default admin users
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
with SessionLocal() as db:
    seed_default_users(db)

app = FastAPI(
    title="B2B Telegram Agent API",
    description="Admin API for the B2B Telegram SaaS control panel",
    version="1.0.0",
)

# Allow the Next.js dashboard to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(businesses_router)
app.include_router(bookings_router)
app.include_router(clients_router)
app.include_router(conversations_router)
app.include_router(ai_providers_router)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "B2B Telegram Admin API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
