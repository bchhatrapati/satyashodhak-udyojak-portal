import os
import tempfile
import smtplib
from email.message import EmailMessage
from datetime import datetime
from typing import Optional

import pandas as pd
import pytz
from sqlalchemy import text
from dotenv import load_dotenv

from app.database.session import engine

load_dotenv()

IST = pytz.timezone("Asia/Kolkata")


# -------------------------------------------------------------------------
# Generate Daily Backup (Direct DB Access)
# -------------------------------------------------------------------------

def generate_daily_backup() -> Optional[str]:
    """
    Generates Excel backup from direct PostgreSQL connection.
    Returns file path if successful.
    """
    try:
        date_str = datetime.now(IST).strftime("%d-%m-%Y")
        file_name = f"Satyashodhak_Backup_{date_str}.xlsx"

        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, file_name)

        # Use direct SQL queries (safe snapshot)
        with engine.connect() as conn:
            df_members = pd.read_sql(text("SELECT * FROM members"), conn)
            df_transactions = pd.read_sql(text("SELECT * FROM transactions"), conn)

        # 🛡️ ENTERPRISE FIX 1: Strip timezones from datetime columns so Excel doesn't crash
        for df in [df_members, df_transactions]:
            tz_columns = df.select_dtypes(include=['datetimetz']).columns
            for col in tz_columns:
                df[col] = df[col].dt.tz_localize(None)

        with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
            df_members.to_excel(writer, sheet_name="Members", index=False)
            df_transactions.to_excel(writer, sheet_name="Transactions", index=False)
        
        print(f"✅ Backup generated at {file_path}")
        return file_path

    except Exception as e:
        print(f"❌ Error generating backup: {e}")
        return None


# -------------------------------------------------------------------------
# Send Backup Email
# -------------------------------------------------------------------------

def send_backup_email(file_path: str) -> None:
    """
    Sends backup Excel file to configured admin emails.
    """
    # 🛡️ ENTERPRISE FIX 2: Guard clause against NoneType errors
    if not file_path:
        print("❌ No valid file path provided. Email skipped.")
        return

    recipient_emails = [
        email.strip()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]

    sender_email = os.getenv("SENDER_EMAIL")
    app_password = os.getenv("SENDER_PASSWORD")

    if not recipient_emails:
        print("❌ No admin emails configured.")
        return

    if not sender_email or not app_password:
        print("❌ Email credentials missing in .env")
        return

    msg = EmailMessage()
    msg["Subject"] = f"Daily Data Backup - {datetime.now(IST).strftime('%d-%m-%Y')}"
    msg["From"] = sender_email
    msg["To"] = ", ".join(recipient_emails)

    msg.set_content(
        "Pranam.\n\nPlease find attached the daily financial backup.\n\nRegards,\nSystem"
    )

    try:
        with open(file_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=os.path.basename(file_path),
            )

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(sender_email, app_password)
            smtp.send_message(msg)

        print("✅ Backup email sent successfully!")

    except Exception as e:
        print(f"❌ Failed to send email: {e}")

    finally:
        # 🛡️ ENTERPRISE FIX 3: Safe deletion that won't crash if file_path is None
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


# -------------------------------------------------------------------------
# Execution Block for Manual Testing
# -------------------------------------------------------------------------
# 🛡️ ENTERPRISE FIX 4: Replaced the raw function call with a proper execution block
if __name__ == "__main__":
    print("⏳ Starting Satyashodhak Daily Backup Process...")
    
    backup_path = generate_daily_backup()
    
    if backup_path:
        print("📧 Attempting to send email...")
        send_backup_email(backup_path)
        print("🎉 Backup process finished!")
    else:
        print("❌ Backup process failed before sending email. Process aborted.")