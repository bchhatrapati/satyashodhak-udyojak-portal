from app.core.config import supabase_admin

try:
    # We ask the Admin worker to just fetch the project settings
    # This proves the URL and Service Key are correct
    res = supabase_admin.auth.get_user() 
    print("✅ Connection Successful! The Master Key is working.")
except Exception as e:
    print(f"❌ Connection Failed: {e}")