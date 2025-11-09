from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADVERTISER = "advertiser"
    PUBLISHER = "publisher"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class AdType(str, Enum):
    DISPLAY = "display"
    VIDEO = "video"
    NATIVE = "native"
    MOBILE = "mobile"

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: UserRole
    company_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    role: UserRole
    company_name: str
    balance: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    advertiser_id: str
    name: str
    budget: float
    daily_budget: float
    start_date: str
    end_date: str
    status: CampaignStatus = CampaignStatus.DRAFT
    targeting: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CampaignCreate(BaseModel):
    name: str
    budget: float
    daily_budget: float
    start_date: str
    end_date: str
    targeting: Dict[str, Any] = {}

class AdCreative(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    ad_type: AdType
    creative_url: str
    title: str
    description: str
    cta_text: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdCreativeCreate(BaseModel):
    campaign_id: str
    ad_type: AdType
    creative_url: str
    title: str
    description: str
    cta_text: str

class Inventory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    publisher_id: str
    site_url: str
    ad_format: str
    min_cpm: float
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InventoryCreate(BaseModel):
    site_url: str
    ad_format: str
    min_cpm: float

class Bid(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    inventory_id: str
    bid_amount: float
    won: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Impression(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    ad_creative_id: str
    inventory_id: str
    cost: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Click(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    impression_id: str
    campaign_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Conversion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    click_id: str
    campaign_id: str
    conversion_value: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Auth utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        role=user_data.role,
        company_name=user_data.company_name,
        balance=10000.0 if user_data.role == UserRole.ADVERTISER else 0.0
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    user.pop('password')
    return {"user": user, "token": token}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

# Campaign endpoints
@api_router.post("/campaigns", response_model=Campaign)
async def create_campaign(campaign_data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADVERTISER:
        raise HTTPException(status_code=403, detail="Only advertisers can create campaigns")
    
    campaign = Campaign(
        advertiser_id=current_user['id'],
        **campaign_data.model_dump()
    )
    
    await db.campaigns.insert_one(campaign.model_dump())
    return campaign

@api_router.get("/campaigns", response_model=List[Campaign])
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.ADVERTISER:
        campaigns = await db.campaigns.find({"advertiser_id": current_user['id']}, {"_id": 0}).to_list(1000)
    else:
        campaigns = await db.campaigns.find({}, {"_id": 0}).to_list(1000)
    return campaigns

@api_router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@api_router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, status: CampaignStatus, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign['advertiser_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.campaigns.update_one({"id": campaign_id}, {"$set": {"status": status}})
    return {"success": True}

# Ad Creative endpoints
@api_router.post("/creatives", response_model=AdCreative)
async def create_creative(creative_data: AdCreativeCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADVERTISER:
        raise HTTPException(status_code=403, detail="Only advertisers can create ad creatives")
    
    creative = AdCreative(**creative_data.model_dump())
    await db.ad_creatives.insert_one(creative.model_dump())
    return creative

@api_router.get("/creatives", response_model=List[AdCreative])
async def get_creatives(campaign_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"campaign_id": campaign_id} if campaign_id else {}
    creatives = await db.ad_creatives.find(query, {"_id": 0}).to_list(1000)
    return creatives

# Inventory endpoints
@api_router.post("/inventory", response_model=Inventory)
async def create_inventory(inventory_data: InventoryCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.PUBLISHER:
        raise HTTPException(status_code=403, detail="Only publishers can create inventory")
    
    inventory = Inventory(
        publisher_id=current_user['id'],
        **inventory_data.model_dump()
    )
    
    await db.inventory.insert_one(inventory.model_dump())
    return inventory

@api_router.get("/inventory", response_model=List[Inventory])
async def get_inventory(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.PUBLISHER:
        inventory = await db.inventory.find({"publisher_id": current_user['id']}, {"_id": 0}).to_list(1000)
    else:
        inventory = await db.inventory.find({"status": "active"}, {"_id": 0}).to_list(1000)
    return inventory

# Bidding endpoints
@api_router.post("/bids/submit")
async def submit_bid(campaign_id: str, inventory_id: str, bid_amount: float, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.ADVERTISER:
        raise HTTPException(status_code=403, detail="Only advertisers can submit bids")
    
    # Check campaign exists and belongs to user
    campaign = await db.campaigns.find_one({"id": campaign_id, "advertiser_id": current_user['id']}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check inventory exists
    inventory = await db.inventory.find_one({"id": inventory_id}, {"_id": 0})
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Process bid (simplified - in real RTB this would be in microseconds)
    won = bid_amount >= inventory['min_cpm']
    
    bid = Bid(
        campaign_id=campaign_id,
        inventory_id=inventory_id,
        bid_amount=bid_amount,
        won=won
    )
    
    await db.bids.insert_one(bid.model_dump())
    
    # If won, create impression
    if won:
        creative = await db.ad_creatives.find_one({"campaign_id": campaign_id}, {"_id": 0})
        if creative:
            impression = Impression(
                campaign_id=campaign_id,
                ad_creative_id=creative['id'],
                inventory_id=inventory_id,
                cost=bid_amount
            )
            await db.impressions.insert_one(impression.model_dump())
    
    return {"won": won, "bid_id": bid.id}

# Analytics endpoints
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.ADVERTISER:
        # Advertiser analytics
        campaigns = await db.campaigns.find({"advertiser_id": current_user['id']}, {"_id": 0}).to_list(1000)
        campaign_ids = [c['id'] for c in campaigns]
        
        total_impressions = await db.impressions.count_documents({"campaign_id": {"$in": campaign_ids}})
        total_clicks = await db.clicks.count_documents({"campaign_id": {"$in": campaign_ids}})
        total_conversions = await db.conversions.count_documents({"campaign_id": {"$in": campaign_ids}})
        
        # Calculate total spend
        impressions = await db.impressions.find({"campaign_id": {"$in": campaign_ids}}, {"_id": 0}).to_list(10000)
        total_spend = sum(imp['cost'] for imp in impressions)
        
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        cvr = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
        
        return {
            "total_campaigns": len(campaigns),
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "total_spend": round(total_spend, 2),
            "ctr": round(ctr, 2),
            "cvr": round(cvr, 2),
            "balance": current_user['balance']
        }
    else:
        # Publisher analytics
        inventory = await db.inventory.find({"publisher_id": current_user['id']}, {"_id": 0}).to_list(1000)
        inventory_ids = [inv['id'] for inv in inventory]
        
        total_impressions = await db.impressions.count_documents({"inventory_id": {"$in": inventory_ids}})
        
        impressions = await db.impressions.find({"inventory_id": {"$in": inventory_ids}}, {"_id": 0}).to_list(10000)
        total_revenue = sum(imp['cost'] for imp in impressions)
        
        return {
            "total_inventory": len(inventory),
            "total_impressions": total_impressions,
            "total_revenue": round(total_revenue, 2),
            "avg_cpm": round(total_revenue / (total_impressions / 1000), 2) if total_impressions > 0 else 0
        }

@api_router.get("/analytics/campaigns/{campaign_id}")
async def get_campaign_analytics(campaign_id: str, current_user: dict = Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    total_impressions = await db.impressions.count_documents({"campaign_id": campaign_id})
    total_clicks = await db.clicks.count_documents({"campaign_id": campaign_id})
    total_conversions = await db.conversions.count_documents({"campaign_id": campaign_id})
    
    impressions = await db.impressions.find({"campaign_id": campaign_id}, {"_id": 0}).to_list(10000)
    total_spend = sum(imp['cost'] for imp in impressions)
    
    ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
    cvr = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
    
    return {
        "campaign": campaign,
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "total_conversions": total_conversions,
        "total_spend": round(total_spend, 2),
        "ctr": round(ctr, 2),
        "cvr": round(cvr, 2)
    }

# Tracking endpoints (for demo purposes)
@api_router.post("/track/click")
async def track_click(impression_id: str, campaign_id: str):
    click = Click(impression_id=impression_id, campaign_id=campaign_id)
    await db.clicks.insert_one(click.model_dump())
    return {"success": True}

@api_router.post("/track/conversion")
async def track_conversion(click_id: str, campaign_id: str, conversion_value: float):
    conversion = Conversion(click_id=click_id, campaign_id=campaign_id, conversion_value=conversion_value)
    await db.conversions.insert_one(conversion.model_dump())
    return {"success": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
