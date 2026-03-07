from sqlalchemy import text
from app.database.session import engine

def test_connection():
    print("⏳ Attempting to wake up Supabase...")
    try:
        with engine.connect() as conn:
            # Test 1: Basic Ping
            result = conn.execute(text("SELECT 1")).fetchone()
            print(f"✅ Connection successful: {result}")
            
            # Test 2: Check for your seeded Admin
            # Using the account number you seeded: SUCCS10000
            query = text("SELECT account_number, full_name, role FROM public.members WHERE account_number = 'SUCCS10000'")
            admin = conn.execute(query).fetchone()
            
            if admin:
                print(f"✅ Admin found: {admin.account_number} - {admin.full_name} ({admin.role})")
            else:
                print("⚠️ Connection works, but Admin 'SUCCS10000' was not found in the table.")
                
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    test_connection()