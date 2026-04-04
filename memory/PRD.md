# Wild Machine - Product Requirements Document

## Original Problem Statement
Build a production-ready, full-stack classified ads platform called "Wild Machine" (formerly Pink Lantern) for escort services. Multi-language (EN/FR/ZH), age verification gate, JWT auth, premium listings, moderation, analytics, SEO optimization, admin/escort dashboards, Stripe payments, email verification, CAPTCHA, geolocation search, legal pages, advanced media management.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, Framer Motion, react-helmet-async
- **Backend:** FastAPI (Python), MongoDB (motor), JWT auth
- **Storage:** AWS S3 / Cloudflare R2 / any S3-compatible (via boto3)
- **Payments:** Stripe Checkout (standard `stripe` Python library, portable)
- **Email:** Resend (API key required for production)
- **CAPTCHA:** Cloudflare Turnstile (test keys for development)
- **Security:** Rate limiting (slowapi), bcrypt password hashing
- **Zero Emergent dependencies** — fully portable and self-hosted

## Credentials
- Admin: admin@wildmachine.com / password123
- Escort: escort1@wildmachine.com / password123
- Client: client1@wildmachine.com / password123

## Phase 1 - COMPLETE
- JWT Authentication with escort/client/admin roles
- Age verification gate, i18n (EN/FR/ZH)
- Homepage with listing grid, search/filter, pagination
- Listing detail page with gallery, pricing, details
- Escort/Admin dashboards, Favorites system, S3 media storage

## Phase 2 - COMPLETE
- Premium Listing System, Escort Verification, Phone Contact
- Banner Advertising, Moderation, Reporting, SEO, Analytics, Rate Limiting

## Phase 3 - COMPLETE
- Real Stripe Payment Integration (6 premium packages)
- Email Verification for Escorts (token, resend, blocks listings)
- Cloudflare Turnstile CAPTCHA (registration + login after failures)
- Distance-Based Geolocation Search (Haversine, radius filters)
- Privacy/Policy Page, About/Contact Page (trilingual)
- Admin Payments Tab

## Phase 4 - COMPLETE (Media Uploader)
- MediaUploader Component with drag & drop, multi-image (20), video (2)
- Upload progress bars, cover photo, reorder, delete
- Video support in gallery

## Rebranding & Independence (Mar 2026) - COMPLETE
- Renamed from "Pink Lantern" to "Wild Machine" everywhere (frontend, backend, SEO, emails)
- New logo: "Wild" (white) + "Machine" (gold) with gold accent bar
- Removed ALL Emergent dependencies (badge, scripts, emergentintegrations, emergentstorage)
- Replaced Emergent storage proxy with standard boto3 S3 client
- Replaced emergentintegrations Stripe with standard `stripe` library
- Added service types: Car Call, En ligne (Online)
- Added Trans category toggle
- Replaced cities with 14 Quebec cities (Montréal, Laval, Longueuil, etc.)

### Environment Variables for Deployment
```
MONGO_URL=              # MongoDB connection string
DB_NAME=                # Database name
JWT_SECRET=             # JWT signing secret
CORS_ORIGINS=           # Allowed origins (comma-separated)
STRIPE_API_KEY=         # Stripe secret key
STRIPE_WEBHOOK_SECRET=  # (optional) Stripe webhook signing secret
S3_BUCKET_NAME=         # S3 bucket name
S3_REGION=              # AWS region (default: us-east-1)
AWS_ACCESS_KEY_ID=      # S3 access key
AWS_SECRET_ACCESS_KEY=  # S3 secret key
S3_ENDPOINT_URL=        # (optional) For R2/MinIO/Spaces
RESEND_API_KEY=         # Resend email API key
SENDER_EMAIL=           # Sender email address
TURNSTILE_SECRET_KEY=   # Cloudflare Turnstile secret
```

## Watermark System (Mar 2026) - COMPLETE
- Auto-watermark "Wild Machine" on all uploaded images (JPEG, PNG, WebP)
- Semi-transparent gold text (~30% opacity) in bottom-right corner
- Shadow for readability on light backgrounds
- Videos not affected
- Applied server-side before S3 upload, only watermarked version saved
- P1: Configure BTCPay Server instance and set env vars
- P1: Configure S3 bucket for production
- P1: Production Resend API key for real email delivery
- P1: Replace Turnstile test keys with production keys
- P2: Escort verification request workflow (request + admin review UI)
- P2: Smart moderation (auto-flag suspicious content)
- P2: Refactor server.py into modules (routes/models/services)

## Legal Pages Overhaul (Mar 2026) - COMPLETE
- Complete rewrite of legal/privacy page with 12 comprehensive sections
- Sections: Legal Identity, Data Protection Officer (Loi 25), Privacy Policy, User Responsibility, Moderation Rights, Platform Clause, Prohibited Content, Copyright/Images, Payments, Legal Contact, Age Verification, Terms of Service
- Compliant with Quebec Loi 25 (privacy law)
- Trilingual (EN/FR/ZH)
- Covers: data types, retention periods, DMCA takedown, watermark disclosure, consent guarantees, moderation rights, applicable law (Quebec/Canada)

## BTCPay Server Integration (Mar 2026) - COMPLETE
- Stripe completely removed (zero references in entire codebase)
- BTCPay Server Greenfield API v1 integration
- 3 endpoints: create-invoice, payment-status, webhook
- Bitcoin (BTC) only, prices in CAD
- Webhook-driven automatic premium activation (InvoiceSettled, InvoiceExpired, InvoiceInvalid)
- Idempotent payment processing (prevents duplicates)
- Env vars: BTCPAY_SERVER_URL, BTCPAY_API_KEY, BTCPAY_STORE_ID, BTCPAY_WEBHOOK_SECRET

## Pending / Future Tasks

## Architecture
```
/app/backend/server.py     - Monolithic FastAPI (all routes/models)
/app/frontend/src/
  App.js                   - Router with HelmetProvider
  pages/                   - All page components
  components/              - Header, Footer, ListingCard, SearchFilters, BannerDisplay,
                             AgeGate, TurnstileWidget, MediaUploader
  context/                 - AuthContext, I18nContext
  lib/                     - api.js, i18n.js
```
