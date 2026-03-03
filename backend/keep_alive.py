import os
import psycopg2

def ping_supabase():
    db_url = os.environ.get("DATABASE_URL")

    if not db_url:
        print("❌ DATABASE_URL not found")
        return

    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        print("✅ Heartbeat successful! Database is awake.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Heartbeat failed: {e}")

if __name__ == "__main__":
    ping_supabase()