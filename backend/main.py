import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.api import api_router
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: Create database tables if they don't exist
    # This is for development - in production use Alembic migrations
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
    
    # Initialize Telegram client if needed
    if settings.TELEGRAM_AUTO_START:
        from app.services.telegram_client import telegram_client
        await telegram_client.start()
    
    yield
    
    # On shutdown: Clean up resources
    if settings.TELEGRAM_AUTO_START:
        from app.services.telegram_client import telegram_client
        await telegram_client.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Telegram CRM API",
    version="1.0.0",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
async def health_check():
    try:
        # Test database connection
        db = SessionLocal()
        await db.execute("SELECT 1")
        db.close()
        return {
            "status": "healthy",
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": str(e),
            "version": "1.0.0"
        }

# Include API router
app.include_router(api_router, prefix=settings.API_PREFIX)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 