from fastapi import APIRouter

from app.api.endpoints import auth, users, messages, contacts, ml

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(ml.router, prefix="/ml", tags=["machine learning"])

@api_router.get("/health")
async def health_check():
    return {"status": "ok"} 