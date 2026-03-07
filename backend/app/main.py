from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, members

app = FastAPI(
    title="Satyashodhak Udyojak Portal",
    description="Backend API for managing cooperative society members and finances.",
    version="1.0.0"
)

# 🌐 CORS Configuration (Crucial for your Frontend later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"
    "http://192.168.43.197:3000"], # In production, change this to your specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Set-Cookie", "Authorization"],
)

# 🚦 Include Department Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(members.router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    return {"message": "Satyashodhak API is running smoothly"}