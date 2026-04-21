import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth, members, admin, transactions
from app.tasks.backup_system import generate_daily_backup, send_backup_email

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
FRONTEND_URL_LOCAL = os.getenv("FRONTEND_URL_LOCAL")
ENVIRONMENT = os.getenv("ENVIRONMENT")

if ENVIRONMENT == "development":
    ALLOW_ORIGINS = [FRONTEND_URL_LOCAL]
else:
    ALLOW_ORIGINS = [FRONTEND_URL]

# --- BACKGROUND TASK LOGIC ---
def execute_full_backup():
    """Synchronous wrapper to generate the backup and send the email."""
    print("⏳ Starting database backup process...")
    file_path = generate_daily_backup()
    
    if file_path:
        print(f"✅ Backup generated at {file_path}. Sending email...")
        send_backup_email(file_path)
    else:
        print("❌ Backup generation failed. Email will not be sent.")

async def automated_backup_loop():
    """Runs continuously in the background while the server is alive."""
    while True:
        # Wait 24 hours (86400 seconds) between backups
        await asyncio.sleep(86400) 
        try:
            # Run the heavy synchronous tasks in a separate thread
            await asyncio.to_thread(execute_full_backup)
        except Exception as e:
            print(f"❌ Backup loop encountered an error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Initiate the 24-hour backup loop
    backup_task = asyncio.create_task(automated_backup_loop())
    yield
    # SHUTDOWN: Gracefully cancel the loop
    backup_task.cancel()

# --- APP INITIALIZATION ---
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
app.include_router(transactions.router, prefix="/api/v1", tags=["Transactions"])

@app.get("/", tags=["Health"])
def root():
    return {"message": "Satyashodhak API is running smoothly"}