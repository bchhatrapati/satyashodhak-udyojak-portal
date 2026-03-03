from app.core.config import supabase

response = supabase.auth.sign_in_with_password({
    "email": "satyashodhakudyojak@gmail.com",
    "password": "25012026@Truth"
})

print(response)