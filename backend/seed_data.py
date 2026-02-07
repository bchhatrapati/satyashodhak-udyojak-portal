import requests

BASE_URL = "http://127.0.0.1:8000"

dummy_members = [
    {
        "full_name": "Rajesh Kumar",
        "phone_number": "9876543210",
        "email": "rajesh@example.com",
        "dob": "1985-05-15", # Added DOB
        "initial_deposit": 5000.0,
        "aadhar_no": "1234-5678-9012",
        "pan_no": "ABCDE1234F",
        "nominee_name": "Sunita Kumar",
        "nominee_relation": "Wife"
    },
    {
        "full_name": "Amit Patil",
        "phone_number": "9988776655",
        "email": "amit@example.com",
        "dob": "1992-11-20", # Added DOB
        "initial_deposit": 1000.0,
        "aadhar_no": "8888-7777-6666",
        "pan_no": "XYZP9876Q",
        "nominee_name": "Sanjay Patil",
        "nominee_relation": "Brother"
    },
    {
        "full_name": "Priya Sharma",
        "phone_number": "9123456789",
        "email": "priya@example.com",
        "dob": "2000-01-01", # Added DOB
        "initial_deposit": 10000.0,
        "aadhar_no": "1111-2222-3333",
        "pan_no": "KLUY4433M",
        "nominee_name": "Vijay Sharma",
        "nominee_relation": "Father"
    }
]

def seed():
    print("🌱 Clearing and Seeding Database...")
    for member in dummy_members:
        # Note: Added empty photo URLs so the API doesn't crash if they are required
        member["photo_url"] = "https://via.placeholder.com/150"
        member["aadhar_url"] = "https://via.placeholder.com/150"
        member["pan_url"] = "https://via.placeholder.com/150"
        
        response = requests.post(f"{BASE_URL}/register-member", json=member)
        if response.status_code == 200:
            print(f"✅ Created: {member['full_name']}")
        else:
            print(f"❌ Failed: {member['full_name']} | Error: {response.text}")

if __name__ == "__main__":
    seed()