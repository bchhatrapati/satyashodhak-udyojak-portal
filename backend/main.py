from fastapi import FastAPI, HTTPException, Form
from pydantic import BaseModel
from app/core/config import supabase # We import the connection from our other file
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, datetime
import pytz # New library for timezones
from apscheduler.schedulers.background import BackgroundScheduler
from backup_system import generate_daily_backup, send_backup_email
from contextlib import asynccontextmanager
from fastapi import UploadFile, File
import re
import uuid


# This function is the "Alarm Clock" task
def scheduled_backup():
    print("⏰ Periodic Backup Started...")
    recipients = ["your_email@gmail.com", "co_founder_email@gmail.com"]
    file_path = generate_daily_backup()
    if file_path:
        send_backup_email(file_path, recipients)

# This handles the server startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Setup the alarm clock
    scheduler = BackgroundScheduler()
    # Set it to run every day at 11:55 PM (23:55)
    scheduler.add_job(scheduled_backup, 'cron', hour=23, minute=55)
    scheduler.start()
    print("🚀 Backup Scheduler is Active (Set for 23:55 daily)")
    
    yield # The server runs here
    
    # SHUTDOWN: Turn off the alarm clock
    scheduler.shutdown()

# Update your FastAPI declaration to use this lifespan
app = FastAPI(lifespan=lifespan)


# Allow your frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a constant for IST
IST = pytz.timezone('Asia/Kolkata')

# Update your MemberCreate Model to include relation
class MemberCreate(BaseModel):
    full_name: str
    phone_number: str
    email: str = None
    dob: str = None  # Added to match DB
    initial_deposit: float
    aadhar_no: str
    pan_no: str
    nominee_name: str
    nominee_relation: str
    photo_url: str = None
    aadhar_url: str = None
    pan_url: str = None
    monthly_installment_date: int = 10
    
# --- HELPER FUNCTIONS ---
def generate_succs_id():
    try:
        # Fetch the tracker record
        res = supabase.table("id_tracker").select("last_sequence_number").eq("id", 1).execute()
        
        # If tracker is empty, create the first record
        if not res.data:
            supabase.table("id_tracker").insert({"id": 1, "last_sequence_number": 0}).execute()
            current_seq = 0
        else:
            current_seq = res.data[0]["last_sequence_number"]
        
        new_seq = current_seq + 1
        
        # Update the tracker
        supabase.table("id_tracker").update({"last_sequence_number": new_seq}).eq("id", 1).execute()
        
        # Applying your 10000 countdown/countup logic
        if new_seq <= 10000:
            new_id_number = 10001 - new_seq 
        else:
            new_id_number = new_seq

        # Safety: Skip 00000
        if new_id_number == 0:
            new_id_number = 10001
            
        return f"SUCCS{new_id_number:05d}"
    except Exception as e:
        print(f"ID Generation Error: {e}")
        raise HTTPException(status_code=500, detail="Could not generate Account Number")

# --- ROUTES ---
@app.post("/register-member")
async def register_member(member: MemberCreate):
    try:
        # 1. Ensure ID is a clean string
        generated_id = f"SAT-{uuid.uuid4().hex[:6].upper()}"

        # 2. Date Validation (Keep it as a string for JSON serialisation)
        try:
            # We just validate it's a real date, but keep the string 'YYYY-MM-DD'
            datetime.strptime(member.dob, "%Y-%m-%d")
        except:
            raise HTTPException(status_code=400, detail="Invalid DOB format. Use YYYY-MM-DD")

        # 3. Check duplicates - FIX: Use 'account_number' instead of 'id'
        existing = supabase.table("members") \
            .select("account_number") \
            .or_(f"phone_number.eq.{member.phone_number},aadhar_no.eq.{member.aadhar_no}") \
            .execute()

        if existing.data:
            raise HTTPException(status_code=400, detail="Phone or Aadhar already registered")

        # 4. Prepare Dictionary - dob must be a string for JSON
        member_dict = {
            "account_number": generated_id,
            "full_name": member.full_name,
            "phone_number": member.phone_number,
            "email": member.email,
            "dob": member.dob, # Use the validated string here
            "balance": member.initial_deposit,
            "aadhar_no": member.aadhar_no,
            "pan_no": member.pan_no,
            "photo_url": member.photo_url,
            "aadhar_url": member.aadhar_url,
            "pan_url": member.pan_url,
            "nominee_name": member.nominee_name,
            "nominee_relation": member.nominee_relation,
            "monthly_installment_date": member.monthly_installment_date,
            "is_active": True
        }

        # 5. Insert
        result = supabase.table("members").insert(member_dict).execute()
        return {"status": "success", "account_number": generated_id}

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}") # This shows up in your terminal
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    

@app.get("/members")
async def get_all_members():
    response = supabase.table("members").select("*").execute()
    return response.data



@app.post("/apply-daily-penalties")
async def apply_penalties():
    today = date.today()
    current_day = today.day
    
    # 1. Find members who are past their date and haven't paid
    # Logic: if today is the 11th and their date was the 10th
    overdue_members = supabase.table("members")\
        .select("account_number, penalty_amount, monthly_installment_date, full_name")\
        .eq("is_active", True)\
        .execute()

    updated_count = 0
    for member in overdue_members.data:
        # Check if today's date is past their installment date
        if current_day > member['monthly_installment_date']:
            # Apply ₹10 penalty
            new_penalty = member['penalty_amount'] + 10
            
            supabase.table("members")\
                .update({
                    "penalty_amount": new_penalty,
                    "is_active": False # Mark as inactive as per your rule
                })\
                .eq("account_number", member["account_number"])\
                .execute()
            updated_count += 1
            
    return {"status": "Success", "penalties_applied_to": updated_count}


class Payment(BaseModel):
    amount_paid: float
    note: str


@app.post("/collect-installment/{account_no}")
async def collect_installment(account_no: str, payment: Payment):
    # 1. Get member details
    res = supabase.table("members").select("*").eq("account_number", account_no).single().execute()
    member = res.data
    
    # 2. Update the member: Clear penalty and set Active
    new_balance = member['balance'] + payment.amount_paid
    
    supabase.table("members").update({
        "balance": new_balance,
        "penalty_amount": 0,    # Penalty cleared
        "is_active": True       # Back to Active status!
    }).eq("account_number", account_no).execute()
    
    # 3. Log the transaction for 100% transparency
    transaction_data = {
        "account_number": account_no,
        "type": "deposit",
        "amount": payment.amount_paid,
        "note": f"Installment Paid. {payment.note}",
        "admin_id": "ADMIN_01"
    }
    supabase.table("transactions").insert(transaction_data).execute()
    
    return {"status": "Member Activated", "new_balance": new_balance}


@app.post("/trigger-manual-backup")
async def trigger_backup():
    recipients = ["kfulkari@gmail.com", "surajbodhe0@gmail.com"] # Change these
    
    file_path = generate_daily_backup()
    if file_path:
        send_backup_email(file_path, recipients)
        return {"status": "success", "message": "Backup sent to emails"}
    else:
        raise HTTPException(status_code=500, detail="Backup generation failed")



@app.get("/admin-stats")
async def get_admin_stats():
    try:
        # 1. Get Total Members count
        total_res = supabase.table("members").select("account_number", count="exact").execute()
        total_count = total_res.count if total_res.count is not None else 0

        # 2. Get Active Members count (using your 'is_active' boolean)
        active_res = supabase.table("members").select("account_number", count="exact").eq("is_active", True).execute()
        active_count = active_res.count if active_res.count is not None else 0

        # 3. Calculate Inactive
        inactive_count = total_count - active_count

        return {
            "total_members": total_count,
            "active_members": active_count,
            "inactive_members": inactive_count
        }
    except Exception as e:
        print(f"📊 Stats Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard statistics")
    

# --- NEW STORAGE ROUTE ---
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...), 
    doc_type: str = Form(...),  # Add this to receive "photo", "aadhar", or "pan"
    member_name: str = Form(...) # Add this to receive the member name
):
    try:
        # 1. Clean the member name (remove spaces)
        clean_member_name = re.sub(r'[^a-zA-Z0-9]', '_', member_name).lower()
        
        # 2. Build the perfect filename: 20260207_suraj_gaikwad_aadhar.jpg
        timestamp = datetime.now().strftime('%Y%m%d')
        file_ext = file.filename.split('.')[-1]
        perfect_name = f"{timestamp}_{clean_member_name}_{doc_type}.{file_ext}"

        file_content = await file.read()
        MAX_SIZE = 1024 * 1024  # 512 KB
        if len(file_content) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="File is too large. Limit is 512KB.")

        # 4. Upload to Supabase
        storage_res = supabase.storage.from_("member-documents").upload(
            path=perfect_name,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # 5. Get the Public URL
        # We assume the 'member-docs' bucket is set to 'Public' in Supabase Dashboard
        public_url_data = supabase.storage.from_("member-documents").get_public_url(perfect_name)
        
        # In the latest supabase-py version, get_public_url returns a string or an object
        # If it's the URL string, we return it.
        return {"url": str(public_url_data)}

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during upload")