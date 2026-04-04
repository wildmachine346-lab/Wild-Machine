from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Query, Header, Request
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import requests as http_requests
import json
import os
import logging
import uuid
import requests
import re
import math
import random
import secrets
import asyncio
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'pink-lantern-fallback-secret')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE = 60
REFRESH_TOKEN_EXPIRE = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import boto3
from botocore.exceptions import ClientError

# ─── S3 Storage ───
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', '')
S3_REGION = os.environ.get('S3_REGION', 'us-east-1')
S3_ENDPOINT_URL = os.environ.get('S3_ENDPOINT_URL', '')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
APP_NAME = "wild-machine"

def _get_s3_client():
    kwargs = {
        "service_name": "s3",
        "region_name": S3_REGION,
    }
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
    if S3_ENDPOINT_URL:
        kwargs["endpoint_url"] = S3_ENDPOINT_URL
    return boto3.client(**kwargs)

# ─── BTCPay Server ───
BTCPAY_SERVER_URL = os.environ.get('BTCPAY_SERVER_URL', '')
BTCPAY_API_KEY = os.environ.get('BTCPAY_API_KEY', '')
BTCPAY_STORE_ID = os.environ.get('BTCPAY_STORE_ID', '')
BTCPAY_WEBHOOK_SECRET = os.environ.get('BTCPAY_WEBHOOK_SECRET', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY')
TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

if RESEND_API_KEY:
    import resend
    resend.api_key = RESEND_API_KEY

# ─── Premium Packages (fixed prices in CAD – never accept from frontend) ───
PREMIUM_PACKAGES = {
    "featured_7": {"premium_type": "featured", "duration_days": 7, "price": 39.99, "currency": "CAD", "name": "Featured 7 Days"},
    "featured_30": {"premium_type": "featured", "duration_days": 30, "price": 99.99, "currency": "CAD", "name": "Featured 30 Days"},
    "featured_90": {"premium_type": "featured", "duration_days": 90, "price": 249.99, "currency": "CAD", "name": "Featured 90 Days"},
    "top_featured_7": {"premium_type": "top_featured", "duration_days": 7, "price": 69.99, "currency": "CAD", "name": "Top Featured 7 Days"},
    "top_featured_30": {"premium_type": "top_featured", "duration_days": 30, "price": 169.99, "currency": "CAD", "name": "Top Featured 30 Days"},
    "top_featured_90": {"premium_type": "top_featured", "duration_days": 90, "price": 449.99, "currency": "CAD", "name": "Top Featured 90 Days"},
}

# ─── Login attempt tracking (in-memory for CAPTCHA after failures) ───
_login_attempts: Dict[str, dict] = {}
LOGIN_CAPTCHA_THRESHOLD = 3

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda req, exc: Response(
    content='{"detail":"Rate limit exceeded"}', status_code=429, media_type="application/json"
))
app.add_middleware(SlowAPIMiddleware)
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Storage ───
def put_object(path, data, content_type):
    if not S3_BUCKET_NAME:
        raise HTTPException(500, "S3 storage not configured (S3_BUCKET_NAME missing)")
    s3 = _get_s3_client()
    s3.put_object(Bucket=S3_BUCKET_NAME, Key=path, Body=data, ContentType=content_type)
    return {"path": path, "size": len(data)}

def get_object(path):
    if not S3_BUCKET_NAME:
        raise HTTPException(500, "S3 storage not configured (S3_BUCKET_NAME missing)")
    s3 = _get_s3_client()
    resp = s3.get_object(Bucket=S3_BUCKET_NAME, Key=path)
    return resp["Body"].read(), resp.get("ContentType", "application/octet-stream")

# ─── Watermark ───
def apply_watermark(image_data: bytes, content_type: str) -> bytes:
    """Apply a semi-transparent 'Wild Machine' watermark to an image."""
    try:
        img = Image.open(BytesIO(image_data)).convert("RGBA")
        w, h = img.size
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        font_size = max(16, min(w, h) // 20)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()
        text = "Wild Machine"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = w - tw - max(10, w // 40)
        y = h - th - max(10, h // 40)
        # Shadow for readability
        draw.text((x + 1, y + 1), text, font=font, fill=(0, 0, 0, 60))
        # Main text: white/gold at ~30% opacity
        draw.text((x, y), text, font=font, fill=(212, 175, 55, 75))
        watermarked = Image.alpha_composite(img, overlay)
        output = BytesIO()
        fmt_map = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}
        fmt = fmt_map.get(content_type, "JPEG")
        if fmt == "JPEG":
            watermarked = watermarked.convert("RGB")
        watermarked.save(output, format=fmt, quality=90)
        return output.getvalue()
    except Exception as e:
        logger.warning(f"Watermark failed, using original: {e}")
        return image_data

# ─── Auth Helpers ───
def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id, role):
    return jwt.encode({"sub": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE), "type": "access"}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id):
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE), "type": "refresh"}, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(authorization.split(" ")[1])
    if payload.get("type") != "access":
        raise HTTPException(401, "Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    if user.get("is_banned"):
        raise HTTPException(403, "Account banned")
    return user

async def get_optional_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        payload = decode_token(authorization.split(" ")[1])
        if payload.get("type") != "access":
            return None
        return await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    except Exception:
        return None

async def require_role(user, roles):
    if user.get("role") not in roles:
        raise HTTPException(403, "Insufficient permissions")

# ─── Turnstile CAPTCHA Verification ───
async def verify_turnstile(token: str) -> bool:
    if not TURNSTILE_SECRET_KEY:
        return True
    if not token:
        return False
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(TURNSTILE_VERIFY_URL, data={
                "secret": TURNSTILE_SECRET_KEY,
                "response": token
            })
            result = response.json()
            return result.get("success", False)
    except Exception as e:
        logger.error(f"Turnstile verification error: {e}")
        return False

# ─── Email Verification Helper ───
async def send_verification_email(email: str, token: str, base_url: str):
    verify_url = f"{base_url}/verify-email?token={token}"
    html_content = f"""
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px; border-radius: 12px;">
        <h1 style="color: #D4AF37; font-size: 28px; margin-bottom: 8px;">Wild Machine</h1>
        <hr style="border: 1px solid #222; margin: 16px 0;" />
        <h2 style="color: #f5f5f5; font-size: 20px;">Verify Your Email</h2>
        <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">
            Thank you for registering. Please click the button below to verify your email address and activate your account.
        </p>
        <a href="{verify_url}" style="display: inline-block; background: #D4AF37; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 14px; margin: 24px 0;">
            Verify Email
        </a>
        <p style="color: #525252; font-size: 12px; margin-top: 24px;">
            Or copy this link: {verify_url}
        </p>
        <p style="color: #525252; font-size: 11px; margin-top: 16px;">
            This link expires in 24 hours. If you did not create an account, please ignore this email.
        </p>
    </div>
    """
    if RESEND_API_KEY:
        import resend
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Verify your Wild Machine account",
            "html": html_content
        }
        try:
            await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Verification email sent to {email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
    else:
        logger.info(f"[DEV MODE] Verification link for {email}: {verify_url}")

# ─── Haversine Distance ───
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def check_login_captcha_required(email: str) -> bool:
    info = _login_attempts.get(email)
    if not info:
        return False
    if datetime.now(timezone.utc) - info["last_attempt"] > timedelta(minutes=15):
        del _login_attempts[email]
        return False
    return info["count"] >= LOGIN_CAPTCHA_THRESHOLD

def record_login_failure(email: str):
    info = _login_attempts.get(email, {"count": 0, "last_attempt": datetime.now(timezone.utc)})
    info["count"] += 1
    info["last_attempt"] = datetime.now(timezone.utc)
    _login_attempts[email] = info

def clear_login_attempts(email: str):
    _login_attempts.pop(email, None)

# ─── Models ───
class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "client"
    display_name: Optional[str] = None
    username: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    turnstile_token: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
    turnstile_token: Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class ListingCreate(BaseModel):
    display_name: str
    age: int
    origin: Optional[str] = None
    measurements: Optional[str] = None
    city: str
    country: Optional[str] = None
    service_area: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_1h: float
    price_30min: Optional[float] = None
    price_2h: Optional[float] = None
    price_overnight: Optional[float] = None
    incall: bool = True
    outcall: bool = False
    car_call: bool = False
    en_ligne: bool = False
    is_trans: bool = False
    description: str
    short_summary: Optional[str] = None
    languages_spoken: List[str] = []
    availability: Optional[str] = None
    contact_method: Optional[str] = None
    phone_number: Optional[str] = None
    whatsapp_optional: Optional[str] = None
    telegram_optional: Optional[str] = None

class ReportCreate(BaseModel):
    listing_id: str
    reason: str
    details: Optional[str] = None

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None

class BannerCreate(BaseModel):
    banner_position: str
    banner_link: Optional[str] = None
    banner_start: Optional[str] = None
    banner_end: Optional[str] = None
    enabled: bool = True

class PremiumAssign(BaseModel):
    premium_type: str = "featured"
    duration_days: int = 30

class CheckoutRequest(BaseModel):
    package_id: str
    listing_id: str
    origin_url: str

class ContactFormRequest(BaseModel):
    name: str
    email: str
    message: str

# ─── Auth Routes ───
@api_router.post("/auth/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, req: RegisterRequest):
    if req.role not in ["escort", "client"]:
        raise HTTPException(400, "Invalid role")
    # Turnstile CAPTCHA validation
    if TURNSTILE_SECRET_KEY:
        if not req.turnstile_token:
            raise HTTPException(400, "CAPTCHA verification required")
        valid = await verify_turnstile(req.turnstile_token)
        if not valid:
            raise HTTPException(400, "CAPTCHA verification failed")
    existing = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    # For escorts: generate verification token
    is_escort = req.role == "escort"
    verification_token = secrets.token_urlsafe(32) if is_escort else None
    verification_expiration = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat() if is_escort else None
    user = {
        "id": user_id, "email": req.email.lower(),
        "password_hash": hash_password(req.password),
        "role": req.role,
        "display_name": req.display_name or req.email.split("@")[0],
        "username": req.username or req.email.split("@")[0],
        "city": req.city or "", "phone": req.phone or "",
        "avatar": "", "is_active": True, "is_banned": False,
        "is_verified": False,
        "email_verified": not is_escort,
        "verification_token": verification_token,
        "verification_expiration": verification_expiration,
        "created_at": now, "updated_at": now
    }
    await db.users.insert_one(user)
    # Send verification email for escorts
    if is_escort and verification_token:
        base_url = str(request.base_url).rstrip("/")
        frontend_origin = request.headers.get("x-frontend-origin", "")
        if frontend_origin:
            await send_verification_email(req.email.lower(), verification_token, frontend_origin)
        else:
            await send_verification_email(req.email.lower(), verification_token, base_url)
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "_id", "verification_token")}
    return {
        "access_token": create_access_token(user_id, req.role),
        "refresh_token": create_refresh_token(user_id),
        "user": safe,
        "email_verification_required": is_escort
    }

@api_router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, req: LoginRequest):
    email_lower = req.email.lower()
    # Check if CAPTCHA required (after multiple failures)
    if check_login_captcha_required(email_lower) and TURNSTILE_SECRET_KEY:
        if not req.turnstile_token:
            raise HTTPException(400, "CAPTCHA verification required after multiple failed attempts")
        valid = await verify_turnstile(req.turnstile_token)
        if not valid:
            raise HTTPException(400, "CAPTCHA verification failed")
    user = await db.users.find_one({"email": email_lower}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        record_login_failure(email_lower)
        captcha_needed = check_login_captcha_required(email_lower)
        raise HTTPException(401, f"Invalid credentials{'|captcha_required' if captcha_needed else ''}")
    if user.get("is_banned"):
        raise HTTPException(403, "Account banned")
    clear_login_attempts(email_lower)
    safe = {k: v for k, v in user.items() if k not in ("password_hash", "verification_token")}
    return {
        "access_token": create_access_token(user["id"], user["role"]),
        "refresh_token": create_refresh_token(user["id"]),
        "user": safe
    }

@api_router.post("/auth/refresh")
async def refresh(req: RefreshRequest):
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return {
        "access_token": create_access_token(user["id"], user["role"]),
        "refresh_token": create_refresh_token(user["id"])
    }

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return {k: v for k, v in user.items() if k not in ("password_hash", "verification_token")}

# ─── Email Verification Routes ───
@api_router.post("/auth/verify-email")
async def verify_email(token: str = Query(...)):
    user = await db.users.find_one({"verification_token": token}, {"_id": 0})
    if not user:
        raise HTTPException(400, "Invalid verification token")
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    exp = user.get("verification_expiration")
    if exp and exp < datetime.now(timezone.utc).isoformat():
        raise HTTPException(400, "Verification token expired. Please request a new one.")
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "email_verified": True,
        "verification_token": None,
        "verification_expiration": None,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"message": "Email verified successfully"}

@api_router.post("/auth/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, user=Depends(get_current_user)):
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    if user.get("role") != "escort":
        raise HTTPException(400, "Only escorts need email verification")
    new_token = secrets.token_urlsafe(32)
    new_expiration = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "verification_token": new_token,
        "verification_expiration": new_expiration
    }})
    frontend_origin = request.headers.get("x-frontend-origin", str(request.base_url).rstrip("/"))
    await send_verification_email(user["email"], new_token, frontend_origin)
    return {"message": "Verification email resent"}

@api_router.get("/auth/login-captcha-status")
async def login_captcha_status(email: str = Query(...)):
    return {"captcha_required": check_login_captcha_required(email.lower())}

# ─── Listing Routes ───
@api_router.get("/listings")
async def get_listings(
    search: Optional[str] = None, city: Optional[str] = None,
    min_price: Optional[float] = None, max_price: Optional[float] = None,
    min_age: Optional[int] = None, max_age: Optional[int] = None,
    origin: Optional[str] = None, incall: Optional[bool] = None,
    outcall: Optional[bool] = None, car_call: Optional[bool] = None,
    en_ligne: Optional[bool] = None, is_trans: Optional[bool] = None,
    verified: Optional[bool] = None,
    premium: Optional[bool] = None, language: Optional[str] = None,
    user_lat: Optional[float] = None, user_lng: Optional[float] = None,
    radius: Optional[float] = None,
    sort: str = "default", page: int = 1, limit: int = 20
):
    query = {"status": "active"}
    if search:
        query["$or"] = [
            {"display_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"short_summary": {"$regex": search, "$options": "i"}}
        ]
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price_1h"] = price_q
    if min_age is not None or max_age is not None:
        age_q = {}
        if min_age is not None:
            age_q["$gte"] = min_age
        if max_age is not None:
            age_q["$lte"] = max_age
        query["age"] = age_q
    if origin:
        query["origin"] = {"$regex": origin, "$options": "i"}
    if incall is not None:
        query["incall"] = incall
    if outcall is not None:
        query["outcall"] = outcall
    if car_call is not None:
        query["car_call"] = car_call
    if en_ligne is not None:
        query["en_ligne"] = en_ligne
    if is_trans is not None:
        query["is_trans"] = is_trans
    if verified:
        query["is_verified"] = True
    if premium:
        query["is_premium"] = True
    if language:
        query["languages_spoken"] = {"$in": [language]}

    # Geo distance search
    use_geo = user_lat is not None and user_lng is not None and radius is not None
    if use_geo:
        # Fetch all matching, compute distance, filter, then paginate
        all_listings = await db.listings.find(query, {"_id": 0}).to_list(5000)
        for listing in all_listings:
            lat = listing.get("latitude")
            lng = listing.get("longitude")
            if lat is not None and lng is not None:
                listing["distance_km"] = round(haversine_distance(user_lat, user_lng, lat, lng), 1)
            else:
                listing["distance_km"] = None
        all_listings = [lst for lst in all_listings if lst.get("distance_km") is not None and lst["distance_km"] <= radius]
        all_listings.sort(key=lambda x: x["distance_km"])
        total = len(all_listings)
        skip = (page - 1) * limit
        listings = all_listings[skip:skip + limit]
        return {"listings": listings, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

    sort_map = {
        "default": [("premium_priority_score", -1), ("is_verified", -1), ("created_at", -1)],
        "newest": [("created_at", -1)],
        "price_asc": [("price_1h", 1)],
        "price_desc": [("price_1h", -1)],
        "verified": [("is_verified", -1), ("created_at", -1)],
        "premium": [("premium_priority_score", -1), ("created_at", -1)],
    }
    sort_spec = sort_map.get(sort, sort_map["default"])
    skip = (page - 1) * limit
    total = await db.listings.count_documents(query)
    listings = await db.listings.find(query, {"_id": 0}).sort(sort_spec).skip(skip).limit(limit).to_list(limit)
    return {"listings": listings, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

@api_router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"views": 1}})
    listing["views"] = listing.get("views", 0) + 1
    return listing

@api_router.post("/listings", status_code=201)
async def create_listing(data: ListingCreate, user=Depends(get_current_user)):
    await require_role(user, ["escort", "admin"])
    # Escorts must verify email before publishing
    if user.get("role") == "escort" and not user.get("email_verified", False):
        raise HTTPException(403, "Please verify your email before creating listings")
    listing_id = str(uuid.uuid4())
    slug = re.sub(r'[^a-z0-9]+', '-', data.display_name.lower()).strip('-')
    now = datetime.now(timezone.utc).isoformat()
    listing = {
        "id": listing_id, "escort_id": user["id"], "slug": f"{slug}-{data.city.lower().replace(' ','-')}",
        **data.model_dump(), "media": [], "status": "active",
        "is_premium": False, "premium_type": "standard",
        "premium_start_date": None, "premium_expiration_date": None,
        "premium_priority_score": 0, "premium_expires": None,
        "is_verified": user.get("is_verified", False),
        "phone_clicks": 0, "phone_reveals": 0,
        "views": 0, "created_at": now, "updated_at": now
    }
    await db.listings.insert_one(listing)
    return await db.listings.find_one({"id": listing_id}, {"_id": 0})

@api_router.put("/listings/{listing_id}")
async def update_listing(listing_id: str, data: ListingCreate, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    update_data = data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["slug"] = re.sub(r'[^a-z0-9]+', '-', data.display_name.lower()).strip('-') + f"-{data.city.lower().replace(' ','-')}"
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    return await db.listings.find_one({"id": listing_id}, {"_id": 0})

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

# ─── Media Routes ───
@api_router.post("/upload/{listing_id}")
async def upload_media(listing_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    is_image = file.content_type in ["image/jpeg", "image/png", "image/webp"]
    is_video = file.content_type in ["video/mp4", "video/webm", "video/quicktime"]
    if not is_image and not is_video:
        raise HTTPException(400, "Invalid file type. Allowed: jpg, png, webp, mp4, webm")
    data = await file.read()
    # Size limits
    if is_image and len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 5MB)")
    if is_video and len(data) > 50 * 1024 * 1024:
        raise HTTPException(400, "Video too large (max 50MB)")
    current_media = listing.get("media", [])
    image_count = sum(1 for m in current_media if m.get("type") == "image")
    video_count = sum(1 for m in current_media if m.get("type") == "video")
    if is_image and image_count >= 20:
        raise HTTPException(400, "Maximum 20 images per listing")
    if is_video and video_count >= 2:
        raise HTTPException(400, "Maximum 2 videos per listing")
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    if is_image:
        data = apply_watermark(data, file.content_type)
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    media_entry = {
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "type": "image" if is_image else "video",
        "is_cover": len(current_media) == 0 and is_image,
        "order": len(current_media), "is_external": False
    }
    await db.listings.update_one({"id": listing_id}, {"$push": {"media": media_entry}})
    return media_entry

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(404, "File not found")

@api_router.delete("/media/{listing_id}/{media_id}")
async def delete_media(listing_id: str, media_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    await db.listings.update_one({"id": listing_id}, {"$pull": {"media": {"id": media_id}}})
    return {"message": "Media deleted"}

@api_router.put("/media/{listing_id}/cover/{media_id}")
async def set_cover(listing_id: str, media_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    await db.listings.update_one({"id": listing_id}, {"$set": {"media.$[].is_cover": False}})
    await db.listings.update_one({"id": listing_id, "media.id": media_id}, {"$set": {"media.$.is_cover": True}})
    return {"message": "Cover updated"}

class ReorderMediaRequest(BaseModel):
    media_ids: List[str]

@api_router.put("/media/{listing_id}/reorder")
async def reorder_media(listing_id: str, data: ReorderMediaRequest, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    media_map = {m["id"]: m for m in listing.get("media", [])}
    reordered = []
    for idx, mid in enumerate(data.media_ids):
        if mid in media_map:
            media_map[mid]["order"] = idx
            reordered.append(media_map[mid])
    # Append any media not in the reorder list
    for m in listing.get("media", []):
        if m["id"] not in [r["id"] for r in reordered]:
            m["order"] = len(reordered)
            reordered.append(m)
    await db.listings.update_one({"id": listing_id}, {"$set": {"media": reordered}})
    return {"message": "Media reordered", "media": reordered}

# ─── Favorites ───
@api_router.post("/favorites/{listing_id}")
async def toggle_favorite(listing_id: str, user=Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["id"], "listing_id": listing_id}, {"_id": 0})
    if existing:
        await db.favorites.delete_one({"user_id": user["id"], "listing_id": listing_id})
        return {"favorited": False}
    await db.favorites.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"],
        "listing_id": listing_id, "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"favorited": True}

@api_router.get("/favorites")
async def get_favorites(user=Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    ids = [f["listing_id"] for f in favs]
    listings = await db.listings.find({"id": {"$in": ids}}, {"_id": 0}).to_list(1000)
    return {"favorites": listings, "favorite_ids": ids}

@api_router.get("/favorites/ids")
async def get_favorite_ids(user=Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return {"favorite_ids": [f["listing_id"] for f in favs]}

# ─── Reports ───
@api_router.post("/reports")
async def create_report(data: ReportCreate, user=Depends(get_current_user)):
    await db.reports.insert_one({
        "id": str(uuid.uuid4()), "listing_id": data.listing_id,
        "reporter_id": user["id"], "reason": data.reason,
        "details": data.details or "", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Report submitted"}

# ─── Admin ───
@api_router.get("/admin/stats")
async def admin_stats(user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    total_phone_clicks = 0
    all_listings = await db.listings.find({}, {"_id": 0, "phone_clicks": 1}).to_list(10000)
    for listing in all_listings:
        total_phone_clicks += listing.get("phone_clicks", 0)
    total_revenue = 0
    paid_txns = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0, "amount": 1}).to_list(10000)
    for txn in paid_txns:
        total_revenue += txn.get("amount", 0)
    return {
        "total_users": await db.users.count_documents({}),
        "total_escorts": await db.users.count_documents({"role": "escort"}),
        "total_clients": await db.users.count_documents({"role": "client"}),
        "total_listings": await db.listings.count_documents({}),
        "active_listings": await db.listings.count_documents({"status": "active"}),
        "pending_listings": await db.listings.count_documents({"status": "pending"}),
        "premium_listings": await db.listings.count_documents({"is_premium": True}),
        "featured_listings": await db.listings.count_documents({"premium_type": "featured"}),
        "top_featured_listings": await db.listings.count_documents({"premium_type": "top_featured"}),
        "verified_escorts": await db.users.count_documents({"role": "escort", "is_verified": True}),
        "total_reports": await db.reports.count_documents({}),
        "pending_reports": await db.reports.count_documents({"status": "pending"}),
        "new_listings_today": await db.listings.count_documents({"created_at": {"$gte": today_start}}),
        "total_phone_clicks": total_phone_clicks,
        "total_banners": await db.banners.count_documents({}),
        "total_revenue": round(total_revenue, 2),
        "total_payments": await db.payment_transactions.count_documents({"payment_status": "paid"})
    }

@api_router.get("/admin/users")
async def admin_users(role: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [{"email": {"$regex": search, "$options": "i"}}, {"display_name": {"$regex": search, "$options": "i"}}]
    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    users = await db.users.find(query, {"_id": 0, "password_hash": 0, "verification_token": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"users": users, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

@api_router.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, action: str = Query(...), user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "User not found")
    actions = {
        "verify": {"$set": {"is_verified": True, "verified_by_admin": user["id"], "verified_date": datetime.now(timezone.utc).isoformat()}},
        "unverify": {"$set": {"is_verified": False, "verified_by_admin": None, "verified_date": None}},
        "ban": {"$set": {"is_banned": True}},
        "unban": {"$set": {"is_banned": False}}
    }
    if action not in actions:
        raise HTTPException(400, "Invalid action")
    await db.users.update_one({"id": user_id}, actions[action])
    if action == "verify":
        await db.listings.update_many({"escort_id": user_id}, {"$set": {"is_verified": True}})
    elif action == "unverify":
        await db.listings.update_many({"escort_id": user_id}, {"$set": {"is_verified": False}})
    elif action == "ban":
        await db.listings.update_many({"escort_id": user_id}, {"$set": {"status": "suspended"}})
    return {"message": f"User {action} successful"}

@api_router.get("/admin/listings")
async def admin_listings(status: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    query = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [{"display_name": {"$regex": search, "$options": "i"}}, {"city": {"$regex": search, "$options": "i"}}]
    skip = (page - 1) * limit
    total = await db.listings.count_documents(query)
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"listings": listings, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

@api_router.put("/admin/listings/{listing_id}")
async def admin_update_listing(listing_id: str, action: str = Query(...), user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if action == "approve":
        await db.listings.update_one({"id": listing_id}, {"$set": {"status": "active"}})
    elif action == "reject":
        await db.listings.update_one({"id": listing_id}, {"$set": {"status": "rejected"}})
    elif action == "suspend":
        await db.listings.update_one({"id": listing_id}, {"$set": {"status": "suspended"}})
    elif action == "featured":
        now = datetime.now(timezone.utc)
        await db.listings.update_one({"id": listing_id}, {"$set": {
            "is_premium": True, "premium_type": "featured", "premium_priority_score": 50,
            "premium_start_date": now.isoformat(),
            "premium_expiration_date": (now + timedelta(days=30)).isoformat(),
            "premium_expires": (now + timedelta(days=30)).isoformat()
        }})
    elif action == "top_featured":
        now = datetime.now(timezone.utc)
        await db.listings.update_one({"id": listing_id}, {"$set": {
            "is_premium": True, "premium_type": "top_featured", "premium_priority_score": 100,
            "premium_start_date": now.isoformat(),
            "premium_expiration_date": (now + timedelta(days=30)).isoformat(),
            "premium_expires": (now + timedelta(days=30)).isoformat()
        }})
    elif action == "premium":
        now = datetime.now(timezone.utc)
        await db.listings.update_one({"id": listing_id}, {"$set": {
            "is_premium": True, "premium_type": "featured", "premium_priority_score": 50,
            "premium_start_date": now.isoformat(),
            "premium_expiration_date": (now + timedelta(days=30)).isoformat(),
            "premium_expires": (now + timedelta(days=30)).isoformat()
        }})
    elif action == "unpremium":
        await db.listings.update_one({"id": listing_id}, {"$set": {
            "is_premium": False, "premium_type": "standard", "premium_priority_score": 0,
            "premium_start_date": None, "premium_expiration_date": None, "premium_expires": None
        }})
    elif action == "delete":
        await db.listings.delete_one({"id": listing_id})
    else:
        raise HTTPException(400, "Invalid action")
    return {"message": f"Listing {action} successful"}

@api_router.get("/admin/reports")
async def admin_reports(status: Optional[str] = None, page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    query = {}
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    total = await db.reports.count_documents(query)
    reports = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"reports": reports, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

@api_router.put("/admin/reports/{report_id}")
async def admin_update_report(report_id: str, action: str = Query(...), user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    if action not in ["reviewed", "dismissed"]:
        raise HTTPException(400, "Invalid action")
    await db.reports.update_one({"id": report_id}, {"$set": {"status": action}})
    return {"message": f"Report {action}"}

# ─── Admin Payments ───
@api_router.get("/admin/payments")
async def admin_payments(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    skip = (page - 1) * limit
    total = await db.payment_transactions.count_documents({})
    txns = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"payments": txns, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

# ─── Escort Dashboard ───
@api_router.get("/escort/listings")
async def get_escort_listings(user=Depends(get_current_user)):
    await require_role(user, ["escort"])
    listings = await db.listings.find({"escort_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"listings": listings}

@api_router.get("/escort/stats")
async def get_escort_stats(user=Depends(get_current_user)):
    await require_role(user, ["escort"])
    my_listings = await db.listings.find({"escort_id": user["id"]}, {"_id": 0}).to_list(100)
    ids = [listing["id"] for listing in my_listings]
    total_views = sum(listing.get("views", 0) for listing in my_listings)
    total_phone_clicks = sum(listing.get("phone_clicks", 0) for listing in my_listings)
    total_phone_reveals = sum(listing.get("phone_reveals", 0) for listing in my_listings)
    total_favs = await db.favorites.count_documents({"listing_id": {"$in": ids}})
    premium_listings = [listing for listing in my_listings if listing.get("is_premium")]
    return {
        "total_listings": len(my_listings),
        "active_listings": sum(1 for listing in my_listings if listing.get("status") == "active"),
        "total_views": total_views, "total_favorites": total_favs,
        "total_phone_clicks": total_phone_clicks,
        "total_phone_reveals": total_phone_reveals,
        "premium_count": len(premium_listings),
        "is_verified": user.get("is_verified", False),
        "verified_date": user.get("verified_date"),
        "email_verified": user.get("email_verified", True)
    }

@api_router.put("/escort/profile")
async def update_escort_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    await require_role(user, ["escort"])
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.display_name:
        update["display_name"] = data.display_name
    if data.city:
        update["city"] = data.city
    if data.phone:
        update["phone"] = data.phone
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    return {"message": "Profile updated"}

@api_router.put("/listings/{listing_id}/toggle")
async def toggle_listing(listing_id: str, user=Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["escort_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")
    new_status = "inactive" if listing["status"] == "active" else "active"
    await db.listings.update_one({"id": listing_id}, {"$set": {"status": new_status}})
    return {"status": new_status}

# ─── Phone Contact Tracking ───
@api_router.post("/listings/{listing_id}/reveal-phone")
async def reveal_phone(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"phone_reveals": 1}})
    return {
        "phone_number": listing.get("phone_number", ""),
        "whatsapp": listing.get("whatsapp_optional", ""),
        "telegram": listing.get("telegram_optional", "")
    }

@api_router.post("/listings/{listing_id}/phone-click")
async def phone_click(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing_id}, {"$inc": {"phone_clicks": 1}})
    return {"message": "Click tracked"}

# ─── BTCPay Premium Checkout ───
@api_router.get("/premium-packages")
async def get_premium_packages():
    return {"packages": {k: {"name": v["name"], "premium_type": v["premium_type"], "duration_days": v["duration_days"], "price": v["price"], "currency": v["currency"]} for k, v in PREMIUM_PACKAGES.items()}}

@api_router.post("/btcpay/create-invoice")
async def create_btcpay_invoice(req: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    await require_role(user, ["escort"])
    if not BTCPAY_SERVER_URL or not BTCPAY_API_KEY or not BTCPAY_STORE_ID:
        raise HTTPException(503, "BTCPay Server not configured")
    pkg = PREMIUM_PACKAGES.get(req.package_id)
    if not pkg:
        raise HTTPException(400, "Invalid package")
    listing = await db.listings.find_one({"id": req.listing_id, "escort_id": user["id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found or not owned by you")
    origin = req.origin_url.rstrip("/")
    txn_id = str(uuid.uuid4())
    # Create BTCPay invoice via Greenfield API
    btcpay_payload = {
        "amount": str(pkg["price"]),
        "currency": pkg["currency"],
        "metadata": {
            "orderId": txn_id,
            "user_id": user["id"],
            "listing_id": req.listing_id,
            "package_id": req.package_id,
            "premium_type": pkg["premium_type"],
            "duration_days": str(pkg["duration_days"]),
        },
        "checkout": {
            "speedPolicy": "MediumSpeed",
            "redirectURL": f"{origin}/payment-success?txn_id={txn_id}",
            "defaultLanguage": "fr",
        },
    }
    try:
        resp = http_requests.post(
            f"{BTCPAY_SERVER_URL}/api/v1/stores/{BTCPAY_STORE_ID}/invoices",
            headers={"Content-Type": "application/json", "Authorization": f"token {BTCPAY_API_KEY}"},
            json=btcpay_payload,
            timeout=30,
        )
        resp.raise_for_status()
        invoice = resp.json()
    except http_requests.exceptions.RequestException as e:
        logger.error(f"BTCPay invoice creation failed: {e}")
        raise HTTPException(502, "Payment service unavailable")
    # Save transaction
    await db.payment_transactions.insert_one({
        "id": txn_id,
        "btcpay_invoice_id": invoice["id"],
        "user_id": user["id"],
        "user_email": user["email"],
        "listing_id": req.listing_id,
        "package_id": req.package_id,
        "premium_type": pkg["premium_type"],
        "duration_days": pkg["duration_days"],
        "amount": pkg["price"],
        "currency": pkg["currency"],
        "payment_status": "pending",
        "payment_method": "btcpay",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": invoice.get("checkoutLink"), "invoice_id": invoice["id"], "txn_id": txn_id}

@api_router.get("/btcpay/payment-status/{txn_id}")
async def get_payment_status(txn_id: str, user=Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"id": txn_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Transaction not found")
    if txn["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Not authorized")
    if txn["payment_status"] == "paid":
        return {"status": "Settled", "payment_status": "paid", "already_processed": True}
    # Poll BTCPay for current status
    if BTCPAY_SERVER_URL and BTCPAY_API_KEY and txn.get("btcpay_invoice_id"):
        try:
            resp = http_requests.get(
                f"{BTCPAY_SERVER_URL}/api/v1/stores/{BTCPAY_STORE_ID}/invoices/{txn['btcpay_invoice_id']}",
                headers={"Authorization": f"token {BTCPAY_API_KEY}"},
                timeout=15,
            )
            if resp.status_code == 200:
                inv = resp.json()
                btcpay_status = inv.get("status", "")
                if btcpay_status == "Settled" and txn["payment_status"] != "paid":
                    await _process_successful_payment(txn)
                    return {"status": "Settled", "payment_status": "paid"}
                elif btcpay_status == "Expired":
                    await db.payment_transactions.update_one({"id": txn_id}, {"$set": {
                        "payment_status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()
                    }})
                    return {"status": "Expired", "payment_status": "expired"}
                elif btcpay_status == "Processing":
                    return {"status": "Processing", "payment_status": "processing"}
                return {"status": btcpay_status, "payment_status": txn["payment_status"]}
        except Exception as e:
            logger.warning(f"BTCPay status poll failed: {e}")
    return {"status": "New", "payment_status": txn["payment_status"]}

async def _process_successful_payment(txn: dict):
    """Idempotent payment processing – prevents duplicate upgrades."""
    result = await db.payment_transactions.update_one(
        {"id": txn["id"], "payment_status": {"$ne": "paid"}},
        {"$set": {
            "payment_status": "paid",
            "payment_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        return  # Already processed
    now = datetime.now(timezone.utc)
    duration = txn.get("duration_days", 30)
    score = 100 if txn.get("premium_type") == "top_featured" else 50
    await db.listings.update_one({"id": txn["listing_id"]}, {"$set": {
        "is_premium": True,
        "premium_type": txn.get("premium_type", "featured"),
        "premium_start_date": now.isoformat(),
        "premium_expiration_date": (now + timedelta(days=duration)).isoformat(),
        "premium_expires": (now + timedelta(days=duration)).isoformat(),
        "premium_priority_score": score
    }})
    logger.info(f"Payment processed: listing {txn['listing_id']} -> {txn.get('premium_type')} for {duration} days")

@api_router.post("/webhook/btcpay")
async def btcpay_webhook(request: Request):
    body = await request.body()
    sig_header = request.headers.get("BTCPAY-SIG", "")
    # Verify HMAC signature if secret is configured
    if BTCPAY_WEBHOOK_SECRET:
        import hmac as _hmac
        import hashlib as _hashlib
        expected = "sha256=" + _hmac.new(BTCPAY_WEBHOOK_SECRET.encode(), body, _hashlib.sha256).hexdigest()
        if not _hmac.compare_digest(expected, sig_header):
            logger.error("BTCPay webhook signature mismatch")
            raise HTTPException(400, "Invalid signature")
    try:
        payload = json.loads(body)
        event_type = payload.get("type", "")
        invoice_id = payload.get("invoiceId", "")
        if event_type in ("InvoiceSettled", "InvoicePaymentSettled") and invoice_id:
            txn = await db.payment_transactions.find_one({"btcpay_invoice_id": invoice_id}, {"_id": 0})
            if txn and txn["payment_status"] != "paid":
                await _process_successful_payment(txn)
                logger.info(f"BTCPay webhook: invoice {invoice_id} settled -> txn {txn['id']}")
        elif event_type == "InvoiceExpired" and invoice_id:
            await db.payment_transactions.update_one(
                {"btcpay_invoice_id": invoice_id},
                {"$set": {"payment_status": "expired", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        elif event_type == "InvoiceInvalid" and invoice_id:
            await db.payment_transactions.update_one(
                {"btcpay_invoice_id": invoice_id},
                {"$set": {"payment_status": "invalid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"BTCPay webhook error: {e}")
        return {"status": "error", "detail": str(e)}

# ─── Escort Premium Upgrade (Legacy Mock – kept for backward compat) ───
@api_router.post("/escort/listings/{listing_id}/upgrade-premium")
async def escort_upgrade_premium(listing_id: str, data: PremiumAssign, user=Depends(get_current_user)):
    await require_role(user, ["escort"])
    listing = await db.listings.find_one({"id": listing_id, "escort_id": user["id"]}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if data.premium_type not in ["featured", "top_featured"]:
        raise HTTPException(400, "Invalid premium type")
    if data.duration_days not in [7, 30, 90]:
        raise HTTPException(400, "Invalid duration")
    now = datetime.now(timezone.utc)
    score = 100 if data.premium_type == "top_featured" else 50
    await db.listings.update_one({"id": listing_id}, {"$set": {
        "is_premium": True, "premium_type": data.premium_type,
        "premium_start_date": now.isoformat(),
        "premium_expiration_date": (now + timedelta(days=data.duration_days)).isoformat(),
        "premium_expires": (now + timedelta(days=data.duration_days)).isoformat(),
        "premium_priority_score": score
    }})
    return {"message": f"Listing upgraded to {data.premium_type} for {data.duration_days} days (mock payment)"}

# ─── Banner Advertising ───
@api_router.get("/banners/{position}")
async def get_banners(position: str):
    now = datetime.now(timezone.utc).isoformat()
    query = {"banner_position": position, "enabled": True}
    banners = await db.banners.find(query, {"_id": 0}).to_list(10)
    active = []
    for b in banners:
        start = b.get("banner_start")
        end = b.get("banner_end")
        if start and start > now:
            continue
        if end and end < now:
            continue
        active.append(b)
    for b in active:
        await db.banners.update_one({"id": b["id"]}, {"$inc": {"banner_views": 1}})
    return {"banners": active}

@api_router.post("/banners/{banner_id}/click")
async def track_banner_click(banner_id: str):
    await db.banners.update_one({"id": banner_id}, {"$inc": {"banner_clicks": 1}})
    return {"message": "Click tracked"}

@api_router.get("/admin/banners")
async def admin_get_banners(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    skip = (page - 1) * limit
    total = await db.banners.count_documents({})
    banners = await db.banners.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"banners": banners, "total": total, "page": page, "pages": max(1, math.ceil(total / limit))}

@api_router.post("/admin/banners", status_code=201)
async def admin_create_banner(data: BannerCreate, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    if data.banner_position not in ["homepage_top_banner", "homepage_mid_banner", "sidebar_banner", "listing_bottom_banner"]:
        raise HTTPException(400, "Invalid position")
    banner = {
        "id": str(uuid.uuid4()),
        "banner_image": "",
        "banner_link": data.banner_link or "",
        "banner_position": data.banner_position,
        "banner_start": data.banner_start or datetime.now(timezone.utc).isoformat(),
        "banner_end": data.banner_end or (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "banner_views": 0, "banner_clicks": 0,
        "enabled": data.enabled,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.banners.insert_one(banner)
    return await db.banners.find_one({"id": banner["id"]}, {"_id": 0})

@api_router.post("/admin/banners/{banner_id}/upload")
async def admin_upload_banner_image(banner_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if not banner:
        raise HTTPException(404, "Banner not found")
    allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed:
        raise HTTPException(400, "Invalid file type")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    path = f"{APP_NAME}/banners/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.banners.update_one({"id": banner_id}, {"$set": {"banner_image": result["path"]}})
    return {"message": "Banner image uploaded", "path": result["path"]}

@api_router.put("/admin/banners/{banner_id}")
async def admin_update_banner(banner_id: str, data: BannerCreate, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    banner = await db.banners.find_one({"id": banner_id}, {"_id": 0})
    if not banner:
        raise HTTPException(404, "Banner not found")
    update = {
        "banner_position": data.banner_position,
        "banner_link": data.banner_link or "",
        "banner_start": data.banner_start,
        "banner_end": data.banner_end,
        "enabled": data.enabled
    }
    await db.banners.update_one({"id": banner_id}, {"$set": update})
    return {"message": "Banner updated"}

@api_router.delete("/admin/banners/{banner_id}")
async def admin_delete_banner(banner_id: str, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    await db.banners.delete_one({"id": banner_id})
    return {"message": "Banner deleted"}

# ─── SEO-friendly listing route ───
@api_router.get("/escort/{city}/{slug}")
async def get_listing_by_slug(city: str, slug: str):
    listing = await db.listings.find_one(
        {"city": {"$regex": city, "$options": "i"}, "slug": {"$regex": slug, "$options": "i"}},
        {"_id": 0}
    )
    if not listing:
        raise HTTPException(404, "Listing not found")
    await db.listings.update_one({"id": listing["id"]}, {"$inc": {"views": 1}})
    listing["views"] = listing.get("views", 0) + 1
    return listing

# ─── Contact Form ───
@api_router.post("/contact")
@limiter.limit("5/minute")
async def submit_contact(request: Request, data: ContactFormRequest):
    await db.contact_messages.insert_one({
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email,
        "message": data.message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Message sent successfully"}

# ─── DB Migration ───
@api_router.post("/migrate")
async def migrate_db():
    listing_updates = {
        "phone_number": "", "whatsapp_optional": "", "telegram_optional": "",
        "phone_clicks": 0, "phone_reveals": 0,
        "premium_type": "standard", "premium_start_date": None,
        "premium_expiration_date": None, "premium_priority_score": 0,
        "latitude": None, "longitude": None, "country": ""
    }
    for field, default in listing_updates.items():
        await db.listings.update_many({field: {"$exists": False}}, {"$set": {field: default}})
    await db.listings.update_many(
        {"is_premium": True, "premium_priority_score": {"$lte": 0}},
        {"$set": {"premium_priority_score": 50, "premium_type": "featured"}}
    )
    user_updates = {"verified_by_admin": None, "verified_date": None, "email_verified": True, "verification_token": None, "verification_expiration": None}
    for field, default in user_updates.items():
        await db.users.update_many({field: {"$exists": False}}, {"$set": {field: default}})
    await db.users.update_many(
        {"is_verified": True, "verified_by_admin": None},
        {"$set": {"verified_by_admin": "system", "verified_date": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Migration complete"}

# ─── Seed Data ───
@api_router.post("/seed")
async def seed_data():
    existing = await db.users.count_documents({})
    if existing > 0:
        return {"message": "Already seeded", "users": existing}

    cities = ["Montréal", "Laval", "Longueuil", "Terrebonne", "Brossard", "Repentigny", "Blainville", "Mirabel", "Dollard-des-Ormeaux", "Châteauguay", "Mascouche", "Saint-Eustache", "Boucherville", "Vaudreuil-Dorion"]
    origins = ["French Canadian", "Brazilian", "Russian", "Japanese", "Korean", "Colombian", "Italian", "Swedish", "Thai", "Chinese", "Australian", "Spanish", "Indian", "British", "Ukrainian"]
    photos = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    ]
    names = ["Sophia","Isabella","Valentina","Natasha","Sakura","Elena","Luna","Aria","Camila","Yuki","Mia","Clara","Victoria","Jade","Lily","Aurora","Alessia","Hana","Maya","Rose","Stella","Bianca","Nina","Zara","Mei"]
    descs = [
        "Elegant and refined companion for discerning gentlemen. I bring sophistication and warmth to every encounter.",
        "International model and luxury companion. Available for dinner dates, travel, and exclusive experiences.",
        "Charming, educated, and naturally beautiful. Let me be your perfect evening companion.",
        "Sophisticated lady with a passion for the finer things in life. GFE specialist.",
        "Athletic, fun-loving, and always dressed to impress. Perfect for social events and private moments."
    ]
    city_geo = {
        "Montréal": {"lat": 45.5017, "lng": -73.5673, "country": "Canada"},
        "Laval": {"lat": 45.6066, "lng": -73.7124, "country": "Canada"},
        "Longueuil": {"lat": 45.5312, "lng": -73.5185, "country": "Canada"},
        "Terrebonne": {"lat": 45.7000, "lng": -73.6333, "country": "Canada"},
        "Brossard": {"lat": 45.4584, "lng": -73.4551, "country": "Canada"},
        "Repentigny": {"lat": 45.7422, "lng": -73.4501, "country": "Canada"},
        "Blainville": {"lat": 45.6700, "lng": -73.8800, "country": "Canada"},
        "Mirabel": {"lat": 45.6500, "lng": -74.0833, "country": "Canada"},
        "Dollard-des-Ormeaux": {"lat": 45.4942, "lng": -73.8242, "country": "Canada"},
        "Châteauguay": {"lat": 45.3800, "lng": -73.7500, "country": "Canada"},
        "Mascouche": {"lat": 45.7500, "lng": -73.6000, "country": "Canada"},
        "Saint-Eustache": {"lat": 45.5650, "lng": -73.9050, "country": "Canada"},
        "Boucherville": {"lat": 45.5912, "lng": -73.4365, "country": "Canada"},
        "Vaudreuil-Dorion": {"lat": 45.4000, "lng": -74.0333, "country": "Canada"},
    }

    admins = []
    for i in range(3):
        admins.append({
            "id": str(uuid.uuid4()), "email": "admin@wildmachine.com" if i == 0 else f"admin{i+1}@wildmachine.com",
            "password_hash": hash_password("password123"), "role": "admin",
            "display_name": f"Admin {i+1}", "username": f"admin{i+1}",
            "city": cities[i % len(cities)], "phone": "", "avatar": "",
            "is_active": True, "is_banned": False, "is_verified": True,
            "email_verified": True, "verification_token": None, "verification_expiration": None,
            "verified_by_admin": "system", "verified_date": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()
        })
    await db.users.insert_many(admins)

    clients = []
    for i in range(10):
        clients.append({
            "id": str(uuid.uuid4()), "email": f"client{i+1}@wildmachine.com",
            "password_hash": hash_password("password123"), "role": "client",
            "display_name": f"Client {i+1}", "username": f"client{i+1}",
            "city": cities[i % len(cities)], "phone": "", "avatar": "",
            "is_active": True, "is_banned": False, "is_verified": False,
            "email_verified": True, "verification_token": None, "verification_expiration": None,
            "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()
        })
    await db.users.insert_many(clients)

    escorts = []
    listings = []
    for i in range(25):
        eid = str(uuid.uuid4())
        city = cities[i % len(cities)]
        name = names[i]
        verified = i < 10
        prem = i < 5
        escorts.append({
            "id": eid, "email": f"escort{i+1}@wildmachine.com",
            "password_hash": hash_password("password123"), "role": "escort",
            "display_name": name, "username": name.lower(), "city": city,
            "phone": f"+1-555-{100+i:04d}", "avatar": photos[i % len(photos)],
            "is_active": True, "is_banned": False, "is_verified": verified,
            "email_verified": True, "verification_token": None, "verification_expiration": None,
            "verified_by_admin": "system" if verified else None,
            "verified_date": datetime.now(timezone.utc).isoformat() if verified else None,
            "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()
        })
        for j in range(2):
            lid = str(uuid.uuid4())
            slug = re.sub(r'[^a-z0-9]+', '-', name.lower()) + f"-{city.lower()}"
            if j > 0:
                slug += f"-{j+1}"
            price = random.choice([200, 250, 300, 350, 400, 500, 600, 800, 1000])
            age = random.randint(21, 38)
            geo = city_geo[city]
            prem_type = "top_featured" if (prem and j == 0 and i < 2) else ("featured" if (prem and j == 0) else "standard")
            prem_score = 100 if prem_type == "top_featured" else (50 if prem_type == "featured" else 0)
            listings.append({
                "id": lid, "escort_id": eid, "slug": slug,
                "display_name": name, "age": age,
                "origin": origins[i % len(origins)],
                "measurements": f"{random.choice(['32B','34C','34D','36C','36D'])}-{random.randint(23,27)}-{random.randint(34,38)}",
                "city": city, "country": geo["country"],
                "service_area": f"Downtown {city}",
                "latitude": geo["lat"] + random.uniform(-0.05, 0.05),
                "longitude": geo["lng"] + random.uniform(-0.05, 0.05),
                "price_1h": price, "price_30min": int(price * 0.65),
                "price_2h": int(price * 1.7), "price_overnight": int(price * 5),
                "incall": random.choice([True, True, True, False]),
                "outcall": random.choice([True, True, False]),
                "car_call": random.choice([True, False, False]),
                "en_ligne": random.choice([True, False, False]),
                "is_trans": random.choice([False, False, False, False, True]),
                "description": descs[i % len(descs)],
                "short_summary": f"Stunning {origins[i % len(origins)]} beauty in {city}. {age}yo, available for memorable experiences.",
                "languages_spoken": random.sample(["English", "French", "Chinese", "Spanish", "Japanese", "Korean", "Italian", "Russian"], k=random.randint(1, 3)),
                "availability": random.choice(["Mon-Fri 6pm-12am", "Daily 10am-10pm", "Weekends only", "By appointment", "24/7"]),
                "contact_method": random.choice(["phone", "email", "text"]),
                "phone_number": f"+1-555-{200+i*2+j:04d}",
                "whatsapp_optional": f"+1-555-{200+i*2+j:04d}" if random.random() > 0.5 else "",
                "telegram_optional": f"@{name.lower()}" if random.random() > 0.6 else "",
                "media": [
                    {"id": str(uuid.uuid4()), "url": photos[(i+j+k) % len(photos)], "type": "image", "is_cover": k == 0, "order": k, "is_external": True}
                    for k in range(3)
                ],
                "status": "active",
                "is_premium": prem_type != "standard",
                "premium_type": prem_type,
                "premium_start_date": datetime.now(timezone.utc).isoformat() if prem_type != "standard" else None,
                "premium_expiration_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat() if prem_type != "standard" else None,
                "premium_expires": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat() if prem_type != "standard" else None,
                "premium_priority_score": prem_score,
                "is_verified": verified,
                "phone_clicks": random.randint(0, 50),
                "phone_reveals": random.randint(0, 100),
                "views": random.randint(10, 500),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 60))).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    await db.users.insert_many(escorts)
    await db.listings.insert_many(listings)

    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.listings.create_index("id", unique=True)
    await db.listings.create_index("escort_id")
    await db.listings.create_index("status")
    await db.listings.create_index([("is_premium", -1), ("is_verified", -1), ("created_at", -1)])
    await db.listings.create_index([("premium_priority_score", -1), ("is_verified", -1), ("created_at", -1)])
    await db.listings.create_index("slug")
    await db.favorites.create_index([("user_id", 1), ("listing_id", 1)], unique=True)
    await db.banners.create_index("banner_position")
    await db.payment_transactions.create_index("btcpay_invoice_id", unique=True, sparse=True)
    await db.payment_transactions.create_index("user_id")
    return {"message": "Seeded", "admins": 3, "escorts": 25, "clients": 10, "listings": len(listings)}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    if S3_BUCKET_NAME:
        logger.info(f"S3 storage configured: bucket={S3_BUCKET_NAME}, region={S3_REGION}")
    else:
        logger.warning("S3 storage NOT configured — file uploads will fail")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
