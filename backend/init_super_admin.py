"""
Script to initialize the first super admin account
Run this script once to create the initial super admin
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import bcrypt
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_super_admin():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Super admin credentials
    super_admin_email = input("Enter super admin email: ")
    super_admin_password = input("Enter super admin password: ")
    super_admin_name = input("Enter super admin name/company: ")
    
    # Check if super admin already exists
    existing = await db.users.find_one({"email": super_admin_email})
    if existing:
        print(f"User with email {super_admin_email} already exists!")
        client.close()
        return
    
    # Hash password
    hashed_password = bcrypt.hashpw(super_admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create super admin document
    super_admin = {
        "id": str(uuid.uuid4()),
        "email": super_admin_email,
        "password": hashed_password,
        "role": "super_admin",
        "company_name": super_admin_name,
        "balance": 0.0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert into database
    await db.users.insert_one(super_admin)
    print(f"\n✅ Super admin created successfully!")
    print(f"Email: {super_admin_email}")
    print(f"Role: super_admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_super_admin())
