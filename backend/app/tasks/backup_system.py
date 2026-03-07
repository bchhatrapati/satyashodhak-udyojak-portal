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

        with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
            df_members.to_excel(writer, sheet_name="Members", index=False)
            df_transactions.to_excel(writer, sheet_name="Transactions", index=False)

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
        # Always delete file after attempt
        if os.path.exists(file_path):
            os.remove(file_path)