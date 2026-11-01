# ORDO — Environment Variables Matrix

This document details all configuration parameters and environment variables used across the ORDO platform. Placeholders are used; secrets must never be committed to Git.

---

## 1. Backend Service (Render Web Service)

Configured under **Render Dashboard** &rarr; **Web Service** &rarr; **Environment**.

| Variable | Type | Required | Browser Allowed | Purpose & Default | Placeholder Example |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `NODE_ENV` | String | **Yes** | No | Runtime environment (`production`, `development`, `test`). In production, activates HSTS, strict cookie security, and fails fast on missing DB config. | `production` |
| `PORT` | Number | **Yes** (Auto) | No | Port Express listens on. Injected automatically by Render (defaults to 10000 on Render). Express binds to `0.0.0.0:$PORT`. | `10000` |
| `FRONTEND_URL` | URL | **Yes** | No | Allowed frontend origin for CORS, CSRF, and post-OAuth redirects without trailing slash. | `https://ordo-app.vercel.app` |
| `ALLOWED_ORIGINS` | CSV | No | No | Comma-separated list of additional preview or custom domain origins. | `https://ordo-preview.vercel.app,https://app.ordo.com` |
| `COOKIE_SAME_SITE`| Enum | No | No | Cookie SameSite policy (`none` for cross-site Vercel/Render, `lax` for unified custom domain). Default: `none` in prod. | `none` |
| `MONGODB_URI` | Secret URI | **Yes** | **NEVER** | MongoDB Atlas TLS connection string with application user credentials. Must target the `ordo` database. | `mongodb+srv://user:pass@cluster0.abcde.mongodb.net/ordo?retryWrites=true&w=majority` |
| `SESSION_SECRET` | Secret | **Yes** | **NEVER** | 32+ character high-entropy key for session state protection. | `d7f8a92b4c1e0f3d6a8b5c2e1f4d7a9b0c3e2f5a8b1c4d7e0f3a6b9c2e5f8a1b` |
| `ACCESS_TOKEN_SECRET` | Secret | **Yes** | **NEVER** | 32+ character key for signing short-lived JWT access tokens (15m expiration). | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `REFRESH_TOKEN_SECRET`| Secret | **Yes** | **NEVER** | 32+ character key for signing long-lived JWT refresh tokens (7d expiration). | `8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918` |
| `GOOGLE_CLIENT_ID`| Public ID | **Yes** | Yes | Google OAuth 2.0 Web Client ID for backend token exchange. | `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Secret | **Yes** | **NEVER** | Google OAuth 2.0 Client Secret for authorization code exchange. | `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GOOGLE_CALLBACK_URL`| URL | **Yes** | No | Render callback endpoint for Google Sign-In/Sign-Up flow. | `https://ordo-backend.onrender.com/api/v1/auth/google/callback` |
| `GOOGLE_CALENDAR_REDIRECT_URL`| URL | No | No | Render callback endpoint for Google Calendar integration. | `https://ordo-backend.onrender.com/api/v1/calendar/google/callback` |
| `OAUTH_TOKEN_ENCRYPTION_KEY`| Secret | **Yes** | **NEVER** | Exactly 32-character AES symmetric key for encrypting external tokens in database. | `4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c` |
| `TRUST_PROXY` | Number | No | No | Reverse proxy hops to trust on Render. Default: `1`. | `1` |
| `EMAIL_PROVIDER_API_KEY`| Secret | No | **NEVER** | Resend or SendGrid transactional email API key. | `re_1234567890abcdef12345678` |
| `EMAIL_FROM` | Email | No | No | Verified sender address for transactional emails. | `noreply@ordo.app` |
| `AI_PROVIDER_API_KEY`| Secret | No | **NEVER** | OpenAI or Gemini API key for automated productivity insights. | `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx` |
| `REDIS_URL` | Secret URI | No | **NEVER** | Redis connection URL if external BullMQ worker queue is provisioned. Default scheduler runs persistently via MongoDB. | `rediss://default:pass@redis-host:6379` |

---

## 2. Frontend Service (Vercel)

Configured under **Vercel Project** &rarr; **Settings** &rarr; **Environment Variables**.

| Variable | Type | Required | Browser Allowed | Purpose & Default | Placeholder Example |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL | **Yes** | **Yes** | Vercel production frontend origin (without trailing slash). | `https://ordo-app.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | URL | **Yes** | **Yes** | API endpoint consumed by browser. Can be set to `/api/v1` (with Vercel rewrites) or `https://ordo-backend.onrender.com/api/v1`. | `https://ordo-backend.onrender.com/api/v1` |
| `BACKEND_INTERNAL_URL` | URL | No | No | Target Render backend URL consumed by Next.js `rewrites()` in `next.config.mjs`. | `https://ordo-backend.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`| Public ID | **Yes** | **Yes** | Google OAuth Web Client ID for frontend button redirects. Matches backend `GOOGLE_CLIENT_ID`. | `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com` |

---

## 3. Secret Generation Helper Commands

Generate cryptographically secure 32-character secrets on your terminal:

```bash
# Generate 32-byte hex string (for SESSION_SECRET, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 16-byte hex string (exactly 32 characters for OAUTH_TOKEN_ENCRYPTION_KEY)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

