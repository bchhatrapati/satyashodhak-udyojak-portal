import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, members, admin

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
FRONTEND_URL_LOCAL = os.getenv("FRONTEND_URL_LOCAL")
ENVIRONMENT = os.getenv("ENVIRONMENT")

if ENVIRONMENT == "development":
    ALLOW_ORIGINS = [FRONTEND_URL_LOCAL]
else:
    ALLOW_ORIGINS = [FRONTEND_URL]

app = FastAPI(
    title="Satyashodhak Udyojak Portal",
    description="Backend API for managing cooperative society members and finances.",
    version="1.0.0"
)

# 🌐 CORS Configuration (Crucial for your Frontend later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS, # In production, change this to your specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Set-Cookie", "Authorization"],
)

# 🚦 Include Department Routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(members.router, prefix="/api/v1", tags=["Members"])
app.include_router(admin.router, prefix="/api/v1", tags=["Admin Dashboard"])

@app.get("/", tags=["Health"])
def root():
    return {"message": "Satyashodhak API is running smoothly"}