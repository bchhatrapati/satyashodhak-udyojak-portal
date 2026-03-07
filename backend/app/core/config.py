import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
anon_key: str = os.getenv("SUPABASE_ANON_KEY")
service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not anon_key or not service_key:
    raise ValueError("Missing Supabase configuration in .env")

# Public client (RLS enabled)
supabase: Client = create_client(url, anon_key)

# Admin client (RLS bypass - backend only)
supabase_admin: Client = create_client(url, service_key)
