# ORDO — Production Environment Variables Matrix

This document provides an exhaustive, audited catalog of all environment variables utilized by the ORDO platform across its production deployment architecture: **Frontend on Vercel** and **Backend on Render Web Service** connected to **MongoDB Atlas**.

---

## 1. Backend Environment Variables (Render Web Service)

Configured under **Render Dashboard** &rarr; **Web Service (ordo-backend)** &rarr; **Environment**.

| Variable Name | Required / Optional | Classification | Browser Allowed | Purpose & Constraints | Where to Obtain / Configure | Placeholder Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Required** | Public / Runtime | No | Set to `production` to activate HSTS, strict security headers, and secure cookie validation. | Render Environment Settings | `production` |
| `PORT` | **Required** (Injected) | Public / Runtime | No | Network port Express listens on. Render automatically injects this value (defaults to 10000 on Render). Express binds to `0.0.0.0:$PORT`. | Injected by Render automatically (do not hardcode). | `10000` |
| `FRONTEND_URL` | **Required** | Secret / Origin | No | Primary production frontend origin without trailing slash. Whitelisted for CORS, Helmet CSP `connectSrc`, and CSRF origin verification. | Your deployed Vercel URL | `https://ordo-app.vercel.app` |
| `ALLOWED_ORIGINS` | Optional | Secret / Origin | No | Comma-separated list of additional frontend origins (e.g. Vercel staging/preview deployments or custom domains). | Vercel Deployment Settings | `https://ordo-preview.vercel.app,https://app.ordo.com` |
| `COOKIE_SAME_SITE` | Optional | Runtime Setting | No | Cookie `SameSite` policy. Set to `none` when Vercel and Render use different hostnames (`.vercel.app` & `.onrender.com`), or `lax` if both share a common parent domain (`app.ordo.com` & `api.ordo.com`). | Render Environment Settings | `none` |
| `MONGODB_URI` | **Required** | **Critical Secret** | **NEVER** | TLS-enabled MongoDB Atlas connection string for least-privilege application user (`readWrite` on `ordo` database). Must not use Atlas admin credentials. | MongoDB Atlas &rarr; Database &rarr; Connect &rarr; Drivers | `mongodb+srv://app_user:YourStrongPassword@cluster0.abcde.mongodb.net/ordo?retryWrites=true&w=majority` |
| `SESSION_SECRET` | **Required** | **Critical Secret** | **NEVER** | High-entropy random key for session signing and fallback hashing (&ge; 32 characters). | Generate via `openssl rand -hex 32` or `crypto.randomBytes(32)` | `d7f8a92b4c1e0f3d6a8b5c2e1f4d7a9b0c3e2f5a8b1c4d7e0f3a6b9c2e5f8a1b` |
| `ACCESS_TOKEN_SECRET` | **Required** | **Critical Secret** | **NEVER** | Cryptographic secret for signing short-lived access JWT tokens (15-minute expiration, &ge; 32 characters). | Generate via `openssl rand -hex 32` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `REFRESH_TOKEN_SECRET`| **Required** | **Critical Secret** | **NEVER** | Cryptographic secret for signing long-lived refresh JWT tokens (7-day expiration, &ge; 32 characters). | Generate via `openssl rand -hex 32` | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |
| `GOOGLE_CLIENT_ID` | **Required** | Public / App ID | Yes (Public) | Google OAuth 2.0 Web Application Client ID for backend token exchange and verification with `google-auth-library`. | Google Cloud Console &rarr; APIs & Services &rarr; Credentials | `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| **Required** | **Critical Secret** | **NEVER** | Google OAuth 2.0 Client Secret used strictly server-side for code exchange during OAuth 2.0 redirect flow. | Google Cloud Console &rarr; APIs & Services &rarr; Credentials | `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GOOGLE_CALLBACK_URL` | **Required** | Configuration | No | Exact production redirect URI for Google Sign-In / Sign-Up authorization callback. Must match Google Cloud Console registration. | Render backend host + route | `https://ordo-backend.onrender.com/api/v1/auth/google/callback` |
| `GOOGLE_CALENDAR_REDIRECT_URL` | Optional | Configuration | No | Exact production redirect URI for Google Calendar OAuth integration. Separate from login callback. | Render backend host + route | `https://ordo-backend.onrender.com/api/v1/calendar/google/callback` |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | **Required** | **Critical Secret** | **NEVER** | Exactly 32-character AES symmetric key used to encrypt external third-party access and refresh tokens at rest in MongoDB. | Generate via `openssl rand -hex 16` (32 hex characters) | `4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c` |
| `EMAIL_PROVIDER_API_KEY` | Optional | Secret | **NEVER** | API key for transactional emails (e.g. Resend, SendGrid) used for email verification and password reset links. | Resend or SendGrid Dashboard | `re_1234567890abcdef12345678` |
| `EMAIL_FROM` | Optional | Configuration | No | Verified sender address for automated transactional emails. | Email Service Provider domain validation | `noreply@ordo.app` |
| `AI_PROVIDER_API_KEY` | Optional | Secret | **NEVER** | API key for AI productivity insights generation (OpenAI, Gemini, or Claude). | Google AI Studio or OpenAI Console | `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `REDIS_URL` | Optional | Secret | **NEVER** | Upstash or Redis connection string if external BullMQ worker queue is provisioned. Default scheduler runs persistently via MongoDB. | Upstash Console or Redis Cloud | `rediss://default:password@endpoint.upstash.io:6379` |
| `TRUST_PROXY` | Optional | Runtime Setting | No | Express reverse proxy hop count. Defaults to `1` on Render to accurately evaluate `req.ip` and client HTTPS protocol. | Render Environment Settings | `1` |

---

## 2. Frontend Environment Variables (Vercel)

Configured under **Vercel Project** &rarr; **Settings** &rarr; **Environment Variables**.

| Variable Name | Required / Optional | Classification | Browser Allowed | Purpose & Constraints | Where to Obtain / Configure | Placeholder Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | **Required** | Public Configuration | **Yes** | Deployed Vercel production origin (no trailing slash). Used for internal navigation, SEO, and absolute link resolution. | Vercel Project Domain | `https://ordo-app.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | **Required** | Public Configuration | **Yes** | Endpoint where frontend API requests are sent. Can be configured as `https://ordo-backend.onrender.com/api/v1` for direct cross-origin, or `/api/v1` when utilizing Vercel Next.js rewrites. | Render Web Service URL | `https://ordo-backend.onrender.com/api/v1` |
| `BACKEND_INTERNAL_URL` | Optional | Configuration | No (Server only) | Backend URL proxy target consumed by Next.js `rewrites()` in `next.config.mjs` when proxying `/api/v1/:path*`. | Render Web Service URL | `https://ordo-backend.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **Required** | Public App ID | **Yes** | Google OAuth Web Client ID for frontend button redirects and Google Identity Services SDK initialization. Matches backend `GOOGLE_CLIENT_ID`. | Google Cloud Console | `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com` |

---

## 3. Security Rules & Git Protections
1. **Zero Secret Leakage**: No server-side secrets (`GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `MONGODB_URI`, `OAUTH_TOKEN_ENCRYPTION_KEY`) must ever carry the `NEXT_PUBLIC_` prefix or be referenced in client components.
2. **Repository Ignored**: `.env`, `.env.local`, `.env.production`, and `.env.*.local` are explicitly excluded in the root [`.gitignore`](file:///c:/Users/rahul/OneDrive/Desktop/ORDO/.gitignore).
3. **Environment Separation**: Vercel `Preview` environments should point to staging backend or use separate sandbox credentials to avoid mutating production MongoDB collections.
