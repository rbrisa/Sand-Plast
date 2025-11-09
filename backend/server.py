from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
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

# Import services
from services.email_service import EmailService
from services.pdf_service import PDFService
from services.audit_service import AuditService
from services.security_service import SecurityService
from middleware.rate_limiter import limiter, rate_limit_exceeded_handler, strict_rate_limit, normal_rate_limit
from slowapi.errors import RateLimitExceeded
import config

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = config.MONGO_URL
client = AsyncIOMotorClient(mongo_url)
db = client[config.DB_NAME]

# JWT Configuration
SECRET_KEY = config.JWT_SECRET
ALGORITHM = config.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = config.ACCESS_TOKEN_EXPIRE_MINUTES

# Stripe Configuration
STRIPE_API_KEY = config.STRIPE_API_KEY

# Platform Settings
PLATFORM_COMMISSION_RATE = config.PLATFORM_COMMISSION_RATE

security = HTTPBearer()

app = FastAPI(title="AOK Platform API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Initialize services
email_service = EmailService(
    api_key=config.SENDGRID_API_KEY,
    from_email=config.SENDGRID_FROM_EMAIL,
    from_name=config.SENDGRID_FROM_NAME
)
pdf_service = PDFService(output_dir=str(config.INVOICE_DIR))
audit_service = AuditService(db=db)
security_service = SecurityService(issuer_name=config.PLATFORM_NAME)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
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

# Payment Packages
PAYMENT_PACKAGES = {
    "starter": {"amount": 100.0, "name": "Starter Package", "credits": 100},
    "professional": {"amount": 500.0, "name": "Professional Package", "credits": 550},
    "enterprise": {"amount": 1000.0, "name": "Enterprise Package", "credits": 1200}
}

# Platform Settings
PLATFORM_COMMISSION_RATE = 0.20  # 20% commission on each bid

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
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str

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

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    amount: float
    currency: str
    package_id: str
    credits: float
    payment_status: str = "pending"
    status: str = "initiated"
    metadata: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "bid_won", "commission", "withdrawal", "deposit"
    user_id: str
    amount: float
    commission_amount: float = 0.0
    description: str
    related_id: Optional[str] = None  # bid_id, campaign_id, etc.
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WithdrawalRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    status: str = "pending"  # pending, approved, rejected, completed
    payment_method: str
    payment_details: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    processed_at: Optional[str] = None

class WithdrawalRequestCreate(BaseModel):
    amount: float
    payment_method: str
    payment_details: str

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

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
        if not user.get('is_active', True):
            raise HTTPException(status_code=403, detail="Account is inactive")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user['role'] not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user['role'] != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

# Auth endpoints
@api_router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, user_data: UserRegister):
    # Check password strength
    password_check = security_service.check_password_strength(user_data.password)
    if not password_check['valid']:
        raise HTTPException(
            status_code=400, 
            detail=f"Mot de passe trop faible: {', '.join(password_check['issues'])}"
        )
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Prevent non-admins from creating admin accounts
    if user_data.role in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Cannot register as admin")
    
    # Create user
    user = User(
        email=user_data.email,
        role=user_data.role,
        company_name=user_data.company_name,
        balance=1000.0 if user_data.role == UserRole.ADVERTISER else 0.0
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
    # Audit log
    await audit_service.log_action(
        user_id=user.id,
        action="USER_REGISTERED",
        resource_type="user",
        resource_id=user.id,
        ip_address=request.client.host if request.client else None
    )
    
    # Send welcome email
    await email_service.send_welcome_email(
        user_email=user.email,
        user_name=user.company_name,
        user_role=user.role
    )
    
    token = create_access_token({"sub": user.id, "role": user.role})
    return {"user": user, "token": token}

@api_router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        # Audit failed login
        await audit_service.log_action(
            user_id="anonymous",
            action="LOGIN_FAILED",
            resource_type="auth",
            details={"email": credentials.email},
            ip_address=request.client.host if request.client else None
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Audit successful login
    await audit_service.log_action(
        user_id=user['id'],
        action="LOGIN_SUCCESS",
        resource_type="auth",
        ip_address=request.client.host if request.client else None
    )
    
    token = create_access_token({"sub": user['id'], "role": user['role']})
    user.pop('password')
    return {"user": user, "token": token}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop('password', None)
    return current_user

# Admin endpoints
@api_router.post("/admin/create")
async def create_admin(admin_data: AdminCreate, current_user: dict = Depends(require_super_admin)):
    # Check if user exists
    existing = await db.users.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create admin
    admin = User(
        email=admin_data.email,
        role=UserRole.ADMIN,
        company_name=admin_data.company_name,
        balance=0.0
    )
    
    admin_doc = admin.model_dump()
    admin_doc['password'] = hash_password(admin_data.password)
    
    await db.users.insert_one(admin_doc)
    return {"message": "Admin created successfully", "admin": admin}

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(10000)
    return users

@api_router.put("/admin/users/{user_id}/status")
async def toggle_user_status(user_id: str, is_active: bool, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deactivating super admin
    if user['role'] == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify super admin")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": is_active}})
    return {"success": True}

@api_router.get("/admin/statistics")
async def get_admin_statistics(current_user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_advertisers = await db.users.count_documents({"role": UserRole.ADVERTISER})
    total_publishers = await db.users.count_documents({"role": UserRole.PUBLISHER})
    total_campaigns = await db.campaigns.count_documents({})
    total_impressions = await db.impressions.count_documents({})
    
    # Calculate total revenue from payments
    payment_transactions = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    total_payments = sum(t['amount'] for t in payment_transactions)
    
    # Calculate platform commissions
    commission_transactions = await db.transactions.find({"type": "commission"}, {"_id": 0}).to_list(10000)
    platform_commission = sum(t['amount'] for t in commission_transactions)
    
    # Total bids
    total_bids = await db.bids.count_documents({"won": True})
    
    return {
        "total_users": total_users,
        "total_advertisers": total_advertisers,
        "total_publishers": total_publishers,
        "total_campaigns": total_campaigns,
        "total_impressions": total_impressions,
        "total_bids": total_bids,
        "total_payments": round(total_payments, 2),
        "platform_commission": round(platform_commission, 2),
        "total_revenue": round(total_payments + platform_commission, 2)
    }

@api_router.get("/admin/platform-revenue")
async def get_platform_revenue(current_user: dict = Depends(require_super_admin)):
    # Get all commission transactions
    commission_transactions = await db.transactions.find(
        {"type": "commission"}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    total_commission = sum(t['amount'] for t in commission_transactions)
    
    # Get payment revenue
    payment_transactions = await db.payment_transactions.find(
        {"payment_status": "paid"}, 
        {"_id": 0}
    ).to_list(10000)
    
    total_payments = sum(t['amount'] for t in payment_transactions)
    
    return {
        "total_commission": round(total_commission, 2),
        "total_payments": round(total_payments, 2),
        "total_platform_revenue": round(total_commission + total_payments, 2),
        "commission_rate": PLATFORM_COMMISSION_RATE * 100,
        "recent_commissions": commission_transactions[:10]
    }

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
    
    campaign = await db.campaigns.find_one({"id": campaign_id, "advertiser_id": current_user['id']}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    inventory = await db.inventory.find_one({"id": inventory_id}, {"_id": 0})
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if advertiser has enough balance
    if current_user['balance'] < bid_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    won = bid_amount >= inventory['min_cpm']
    
    bid = Bid(
        campaign_id=campaign_id,
        inventory_id=inventory_id,
        bid_amount=bid_amount,
        won=won
    )
    
    await db.bids.insert_one(bid.model_dump())
    
    if won:
        # Calculate commission
        commission = bid_amount * PLATFORM_COMMISSION_RATE
        publisher_payment = bid_amount - commission
        
        # Deduct from advertiser
        await db.users.update_one(
            {"id": current_user['id']},
            {"$inc": {"balance": -bid_amount}}
        )
        
        # Credit publisher (minus commission)
        await db.users.update_one(
            {"id": inventory['publisher_id']},
            {"$inc": {"balance": publisher_payment}}
        )
        
        # Record transactions
        # Advertiser transaction
        adv_transaction = Transaction(
            type="bid_won",
            user_id=current_user['id'],
            amount=-bid_amount,
            commission_amount=0,
            description=f"Bid won for inventory {inventory_id}",
            related_id=bid.id
        )
        await db.transactions.insert_one(adv_transaction.model_dump())
        
        # Publisher transaction
        pub_transaction = Transaction(
            type="bid_won",
            user_id=inventory['publisher_id'],
            amount=publisher_payment,
            commission_amount=commission,
            description=f"Revenue from inventory {inventory_id}",
            related_id=bid.id
        )
        await db.transactions.insert_one(pub_transaction.model_dump())
        
        # Platform commission transaction
        platform_transaction = Transaction(
            type="commission",
            user_id="platform",
            amount=commission,
            commission_amount=commission,
            description=f"Commission from bid {bid.id}",
            related_id=bid.id
        )
        await db.transactions.insert_one(platform_transaction.model_dump())
        
        # Create impression
        creative = await db.ad_creatives.find_one({"campaign_id": campaign_id}, {"_id": 0})
        if creative:
            impression = Impression(
                campaign_id=campaign_id,
                ad_creative_id=creative['id'],
                inventory_id=inventory_id,
                cost=bid_amount
            )
            await db.impressions.insert_one(impression.model_dump())
    
    return {"won": won, "bid_id": bid.id, "commission": commission if won else 0, "publisher_payment": publisher_payment if won else 0}

# Analytics endpoints
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == UserRole.ADVERTISER:
        campaigns = await db.campaigns.find({"advertiser_id": current_user['id']}, {"_id": 0}).to_list(1000)
        campaign_ids = [c['id'] for c in campaigns]
        
        total_impressions = await db.impressions.count_documents({"campaign_id": {"$in": campaign_ids}})
        total_clicks = await db.clicks.count_documents({"campaign_id": {"$in": campaign_ids}})
        total_conversions = await db.conversions.count_documents({"campaign_id": {"$in": campaign_ids}})
        
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

# Tracking endpoints
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

# Payment endpoints
@api_router.get("/payments/packages")
async def get_payment_packages():
    return {"packages": PAYMENT_PACKAGES}

@api_router.post("/payments/checkout")
async def create_checkout_session(checkout_data: CheckoutRequest, current_user: dict = Depends(get_current_user)):
    # Validate package
    if checkout_data.package_id not in PAYMENT_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PAYMENT_PACKAGES[checkout_data.package_id]
    
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        # Initialize Stripe
        webhook_url = f"{checkout_data.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create success and cancel URLs
        success_url = f"{checkout_data.origin_url}/payment/success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
        cancel_url = f"{checkout_data.origin_url}/payment/cancel"
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=package['amount'],
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user['id'],
                "package_id": checkout_data.package_id,
                "credits": str(package['credits'])
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            user_id=current_user['id'],
            session_id=session.session_id,
            amount=package['amount'],
            currency="usd",
            package_id=checkout_data.package_id,
            credits=package['credits'],
            payment_status="pending",
            status="initiated",
            metadata={
                "package_name": package['name'],
                "user_email": current_user['email']
            }
        )
        
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {"url": session.url, "session_id": session.session_id}
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction if payment successful and not already processed
        if checkout_status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            
            if transaction and transaction['payment_status'] != "paid":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "status": "completed",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                # Add credits to user balance
                await db.users.update_one(
                    {"id": transaction['user_id']},
                    {"$inc": {"balance": transaction['credits']}}
                )
                
                # Send confirmation email
                await email_service.send_payment_confirmation(
                    user_email=current_user['email'],
                    amount=transaction['amount'],
                    credits=transaction['credits']
                )
                
                # Audit log
                await audit_service.log_action(
                    user_id=current_user['id'],
                    action="PAYMENT_COMPLETED",
                    resource_type="payment",
                    resource_id=session_id,
                    details={"amount": transaction['amount'], "credits": transaction['credits']}
                )
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total / 100,
            "currency": checkout_status.currency
        }
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process webhook
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            
            if transaction and transaction['payment_status'] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {
                        "$set": {
                            "payment_status": "paid",
                            "status": "completed",
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                await db.users.update_one(
                    {"id": transaction['user_id']},
                    {"$inc": {"balance": transaction['credits']}}
                )
        
        return {"success": True}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Withdrawal endpoints
@api_router.post("/withdrawals/request")
async def request_withdrawal(request: Request, withdrawal_data: WithdrawalRequestCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != UserRole.PUBLISHER:
        raise HTTPException(status_code=403, detail="Only publishers can request withdrawals")
    
    # Check minimum amount
    min_amount = config.MIN_WITHDRAWAL_AMOUNT
    if withdrawal_data.amount < min_amount:
        raise HTTPException(status_code=400, detail=f"Minimum withdrawal amount is ${min_amount}")
    
    # Check balance
    if current_user['balance'] < withdrawal_data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create withdrawal request
    withdrawal = WithdrawalRequest(
        user_id=current_user['id'],
        **withdrawal_data.model_dump()
    )
    
    await db.withdrawal_requests.insert_one(withdrawal.model_dump())
    
    # Deduct from balance (will be refunded if rejected)
    await db.users.update_one(
        {"id": current_user['id']},
        {"$inc": {"balance": -withdrawal_data.amount}}
    )
    
    # Record transaction
    transaction = Transaction(
        type="withdrawal",
        user_id=current_user['id'],
        amount=-withdrawal_data.amount,
        description=f"Withdrawal request via {withdrawal_data.payment_method}",
        related_id=withdrawal.id
    )
    await db.transactions.insert_one(transaction.model_dump())
    
    # Audit log
    await audit_service.log_action(
        user_id=current_user['id'],
        action="WITHDRAWAL_REQUESTED",
        resource_type="withdrawal",
        resource_id=withdrawal.id,
        details={"amount": withdrawal_data.amount, "method": withdrawal_data.payment_method},
        ip_address=request.client.host if request.client else None
    )
    
    # Send email notification
    await email_service.send_withdrawal_notification(
        user_email=current_user['email'],
        amount=withdrawal_data.amount,
        status="pending"
    )
    
    return {"success": True, "withdrawal_id": withdrawal.id, "message": "Withdrawal request submitted"}

@api_router.get("/withdrawals/my-requests")
async def get_my_withdrawals(current_user: dict = Depends(get_current_user)):
    withdrawals = await db.withdrawal_requests.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return withdrawals

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(status: Optional[str] = None, current_user: dict = Depends(require_admin)):
    query = {"status": status} if status else {}
    withdrawals = await db.withdrawal_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with user data
    for withdrawal in withdrawals:
        user = await db.users.find_one({"id": withdrawal['user_id']}, {"_id": 0, "password": 0})
        withdrawal['user'] = user
    
    return withdrawals

@api_router.put("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(request: Request, withdrawal_id: str, current_user: dict = Depends(require_admin)):
    withdrawal = await db.withdrawal_requests.find_one({"id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    if withdrawal['status'] != "pending":
        raise HTTPException(status_code=400, detail="Withdrawal already processed")
    
    # Update status
    await db.withdrawal_requests.update_one(
        {"id": withdrawal_id},
        {
            "$set": {
                "status": "approved",
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Get user
    user = await db.users.find_one({"id": withdrawal['user_id']})
    
    # Audit log
    await audit_service.log_action(
        user_id=current_user['id'],
        action="WITHDRAWAL_APPROVED",
        resource_type="withdrawal",
        resource_id=withdrawal_id,
        details={"amount": withdrawal['amount'], "publisher_id": withdrawal['user_id']},
        ip_address=request.client.host if request.client else None
    )
    
    # Send email to publisher
    if user:
        await email_service.send_withdrawal_notification(
            user_email=user['email'],
            amount=withdrawal['amount'],
            status="approved"
        )
    
    return {"success": True, "message": "Withdrawal approved"}

@api_router.put("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(request: Request, withdrawal_id: str, current_user: dict = Depends(require_admin)):
    withdrawal = await db.withdrawal_requests.find_one({"id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    if withdrawal['status'] != "pending":
        raise HTTPException(status_code=400, detail="Withdrawal already processed")
    
    # Refund to user
    await db.users.update_one(
        {"id": withdrawal['user_id']},
        {"$inc": {"balance": withdrawal['amount']}}
    )
    
    # Update status
    await db.withdrawal_requests.update_one(
        {"id": withdrawal_id},
        {
            "$set": {
                "status": "rejected",
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Get user
    user = await db.users.find_one({"id": withdrawal['user_id']})
    
    # Audit log
    await audit_service.log_action(
        user_id=current_user['id'],
        action="WITHDRAWAL_REJECTED",
        resource_type="withdrawal",
        resource_id=withdrawal_id,
        details={"amount": withdrawal['amount'], "publisher_id": withdrawal['user_id']},
        ip_address=request.client.host if request.client else None
    )
    
    # Send email to publisher
    if user:
        await email_service.send_withdrawal_notification(
            user_email=user['email'],
            amount=withdrawal['amount'],
            status="rejected"
        )
    
    return {"success": True, "message": "Withdrawal rejected and balance refunded"}

# Transaction history
@api_router.get("/transactions/my-history")
async def get_my_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return transactions

# PDF Reports
@api_router.get("/reports/campaign/{campaign_id}/pdf")
async def generate_campaign_report_pdf(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Génère un rapport PDF pour une campagne"""
    # Get campaign analytics
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
    
    report_data = {
        "campaign_id": campaign_id,
        "campaign_name": campaign['name'],
        "impressions": total_impressions,
        "clicks": total_clicks,
        "ctr": ctr,
        "conversions": total_conversions,
        "cvr": cvr,
        "spend": total_spend
    }
    
    # Generate PDF
    pdf_path = pdf_service.generate_campaign_report(report_data)
    
    # Audit log
    await audit_service.log_action(
        user_id=current_user['id'],
        action="REPORT_GENERATED",
        resource_type="campaign",
        resource_id=campaign_id,
        details={"report_type": "pdf"}
    )
    
    return FileResponse(pdf_path, media_type='application/pdf', filename=f"campaign_report_{campaign_id}.pdf")

@api_router.post("/invoices/generate")
async def generate_invoice(current_user: dict = Depends(get_current_user)):
    """Génère une facture pour un paiement"""
    # Get recent completed payment
    payment = await db.payment_transactions.find_one(
        {"user_id": current_user['id'], "payment_status": "paid"},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not payment:
        raise HTTPException(status_code=404, detail="No completed payment found")
    
    invoice_data = {
        "invoice_number": f"INV-{payment['id'][:8].upper()}",
        "customer_name": current_user['company_name'],
        "customer_email": current_user['email'],
        "items": [
            {
                "description": payment['metadata'].get('package_name', 'Credit Package'),
                "quantity": 1,
                "unit_price": payment['amount'],
                "total": payment['amount']
            }
        ],
        "total": payment['amount']
    }
    
    # Generate PDF invoice
    pdf_path = pdf_service.generate_invoice(invoice_data)
    
    # Audit log
    await audit_service.log_action(
        user_id=current_user['id'],
        action="INVOICE_GENERATED",
        resource_type="payment",
        resource_id=payment['id'],
        details={"amount": payment['amount']}
    )
    
    return FileResponse(pdf_path, media_type='application/pdf', filename=f"invoice_{invoice_data['invoice_number']}.pdf")

# Audit Logs (Admin only)
@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(require_admin)
):
    """Récupère les logs d'audit"""
    logs = await audit_service.search_logs(
        action=action,
        resource_type=resource_type,
        limit=limit
    )
    return logs

@api_router.get("/admin/audit-logs/user/{user_id}")
async def get_user_audit_logs(user_id: str, limit: int = 100, current_user: dict = Depends(require_admin)):
    """Récupère les logs d'un utilisateur spécifique"""
    logs = await audit_service.get_user_activity(user_id, limit)
    return logs

# Security - 2FA endpoints
@api_router.post("/security/2fa/enable")
async def enable_2fa(current_user: dict = Depends(get_current_user)):
    """Active 2FA pour l'utilisateur"""
    # Generate secret
    secret = security_service.generate_2fa_secret()
    
    # Generate QR code
    qr_code = security_service.generate_2fa_qr_code(current_user['email'], secret)
    
    # Store secret (temporarily, will be confirmed later)
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"two_fa_secret_temp": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "message": "Scannez ce QR code avec Google Authenticator ou Authy"
    }

@api_router.post("/security/2fa/verify")
async def verify_2fa_setup(token: str, current_user: dict = Depends(get_current_user)):
    """Vérifie et confirme la configuration 2FA"""
    user = await db.users.find_one({"id": current_user['id']})
    secret = user.get('two_fa_secret_temp')
    
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    # Verify token
    if security_service.verify_2fa_token(secret, token):
        # Move secret from temp to permanent
        await db.users.update_one(
            {"id": current_user['id']},
            {
                "$set": {"two_fa_secret": secret, "two_fa_enabled": True},
                "$unset": {"two_fa_secret_temp": ""}
            }
        )
        
        # Audit log
        await audit_service.log_action(
            user_id=current_user['id'],
            action="2FA_ENABLED",
            resource_type="security",
            resource_id=current_user['id']
        )
        
        return {"success": True, "message": "2FA activé avec succès"}
    else:
        raise HTTPException(status_code=400, detail="Token invalide")

@api_router.post("/security/2fa/disable")
async def disable_2fa(token: str, current_user: dict = Depends(get_current_user)):
    """Désactive 2FA"""
    user = await db.users.find_one({"id": current_user['id']})
    
    if not user.get('two_fa_enabled'):
        raise HTTPException(status_code=400, detail="2FA not enabled")
    
    # Verify token before disabling
    if security_service.verify_2fa_token(user['two_fa_secret'], token):
        await db.users.update_one(
            {"id": current_user['id']},
            {
                "$set": {"two_fa_enabled": False},
                "$unset": {"two_fa_secret": ""}
            }
        )
        
        # Audit log
        await audit_service.log_action(
            user_id=current_user['id'],
            action="2FA_DISABLED",
            resource_type="security",
            resource_id=current_user['id']
        )
        
        return {"success": True, "message": "2FA désactivé"}
    else:
        raise HTTPException(status_code=400, detail="Token invalide")

# Health check endpoint (no rate limit)
@api_router.get("/health")
async def health_check():
    """Endpoint de santé"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }

app.include_router(api_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create logs directory
logs_dir = ROOT_DIR / 'logs'
logs_dir.mkdir(exist_ok=True)

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(logs_dir / 'app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info(f"AOK Platform starting up - Version 2.0.0")
    logger.info(f"Rate limiting: {'Enabled' if config.RATE_LIMIT_ENABLED else 'Disabled'}")
    logger.info(f"Audit logging: {'Enabled' if config.AUDIT_LOG_ENABLED else 'Disabled'}")
    logger.info(f"Email service: {'Configured' if config.SENDGRID_API_KEY else 'Mock mode'}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("AOK Platform shutting down")
    client.close()
