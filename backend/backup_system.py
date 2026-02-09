import pandas as pd
import smtplib
from email.message import EmailMessage
from app/core/config import supabase
from datetime import datetime
import pytz
import os

IST = pytz.timezone('Asia/Kolkata')

def generate_daily_backup():
    try:
        # 1. Fetch Data from Supabase
        members_res = supabase.table("members").select("*").execute()
        trans_res = supabase.table("transactions").select("*").execute()
        
        # 2. Convert to DataFrames (Excel-friendly format)
        df_members = pd.DataFrame(members_res.data)
        df_transactions = pd.DataFrame(trans_res.data)
        
        # 3. Create Excel file with two sheets
        file_name = f"Satyashodhak_Backup_{datetime.now(IST).strftime('%d-%m-%Y')}.xlsx"
        with pd.ExcelWriter(file_name, engine='openpyxl') as writer:
            df_members.to_excel(writer, sheet_name='Members', index=False)
            df_transactions.to_excel(writer, sheet_name='Transactions', index=False)
        
        return file_name
    except Exception as e:
        print(f"Error generating Excel: {e}")
        return None

def send_backup_email(file_path, recipient_emails):
    # Get credentials from .env
    sender_email = os.environ.get("SENDER_EMAIL")
    app_password = os.environ.get("SENDER_PASSWORD") # The 16-digit App Password

    msg = EmailMessage()
    msg['Subject'] = f"Daily Data Backup - {datetime.now(IST).strftime('%d-%m-%Y')}"
    msg['From'] = sender_email
    msg['To'] = ", ".join(recipient_emails)
    msg.set_content("Pranam. Please find the attached daily backup of the Satyashodhak Udyojak Portal.")

    # Attach the Excel file
    with open(file_path, 'rb') as f:
        file_data = f.read()
        msg.add_attachment(file_data, maintype='application', subtype='vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename=file_path)

    # Send using Gmail SMTP
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(sender_email, app_password)
        smtp.send_message(msg)
    
    # Delete local file after sending to keep your server clean
    os.remove(file_path)
    print("✅ Backup email sent successfully!")