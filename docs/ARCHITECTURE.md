# ORDO — System Architecture & Design Specification

## 1. System Overview

ORDO is an intentional daily planning and execution operating system designed to eliminate chaotic to-do lists through continuous calendar alignment, energy-aware scheduling, routine templates, and reflection analytics.

The target production infrastructure is structured as follows:

```
+-----------------------------------------------------------------------------------------+
|                                    User Browser Client                                  |
|                         (Modern Desktop & Mobile Responsive Web)                        |
+--------------------------------------------+--------------------------------------------+
                                             |
                      +----------------------+----------------------+
                      | (HTTPS / Top-level)                         | (HTTPS / API)
                      v                                             v
     +----------------------------------+          +----------------------------------+
     |      Google Identity Provider    |          |          Vercel Edge CDN         |
     |   OAuth 2.0 Auth & ID Tokens     |          |       Next.js 14 App Router      |
     |      accounts.google.com         |          |    https://ordo-app.vercel.app   |
     +----------------+-----------------+          +----------------+-----------------+
                      |                                             |
                      | Authorization Code                          | Reverse Proxy / Direct CORS
                      | Callback Redirect                           | Credentials: 'include'
                      v                                             v
+-----------------------------------------------------------------------------------------+
|                               Render Web Service (Backend)                              |
|                          Node.js 20+ / Express / TypeScript API                         |
|                            https://ordo-backend.onrender.com                            |
|                                                                                         |
|  - Security Middleware: Helmet CSP, HSTS, Rate Limiters, NoSQL Sanitizer                |
|  - Authentication: bcryptjs (12 rounds), Google OAuth 2.0 (google-auth-library)         |
|  - Session Management: HttpOnly SameSite=None; Secure JWT Tokens                        |
|  - CSRF Guard: Double-submit cookie + X-CSRF-Token + Origin verification                 |
|  - Domain Routes: /auth, /tasks, /planner, /routines, /calendar, /analytics, /ai         |
|  - Background Worker: In-process MongoDB-backed durable reminder dispatcher             |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | TLS Mongoose Connection
                                             v
+-----------------------------------------------------------------------------------------+
|                                   MongoDB Atlas Cluster                                 |
|                               Database: 'ordo' (M0 / M10+)                              |
|                                                                                         |
|  - User & Session Store: users (with activeSessions array & tokenVersion)               |
|  - Task Engine: tasks, taskoutcomes (atomic status changes & failure reasons)            |
|  - Routine Templates: routinetemplates, routinetemplateitems                             |
|  - Calendar Integration: calendarconnections, calendarevents (encrypted tokens)         |
|  - Durable Notifications: reminders, notifications                                      |
|  - Analytics & AI: weeklyreviews, aiinsights                                            |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Design

### 2.1 Frontend Architecture (Vercel)
- **Framework:** Next.js 14 (App Router) with React 18, TypeScript, and Tailwind CSS.
- **State & Data Fetching:** Zustand for local UI dialog states; TanStack React Query for declarative server cache invalidation and optimistic updates.
- **Components:** Accessible primitives built on Radix UI (`@radix-ui/react-*`), Lucide icons, and Sonner notifications.
- **API Client:** Centralized [`ApiClient`](../frontend/src/lib/api.ts) with automatic `credentials: 'include'` for HttpOnly cookies, dynamic `X-CSRF-Token` header injection with in-memory caching fallback, and error interception.
- **Deployment Strategy:** Deployed on Vercel Edge Network with static route generation (`next build`) and optional reverse-proxy rewrites (`/api/v1/:path*` &rarr; Render) to eliminate cross-domain third-party cookie restrictions.

### 2.2 Backend Architecture (Render)
- **Runtime:** Node.js 20+ LTS running compiled JavaScript (`dist/index.js`) built with `tsc`.
- **Server:** Express 4.x configured to bind dynamically to `0.0.0.0:$PORT` with reverse proxy trust (`app.set('trust proxy', 1)`).
- **Graceful Shutdown:** Intercepts `SIGTERM` and `SIGINT` to stop the reminder scheduler, close HTTP socket connections, and disconnect cleanly from MongoDB Atlas.
- **Health Architecture:**
  - `GET /api/v1/health/live`: Fast liveness probe returning HTTP 200 if the process is responsive.
  - `GET /api/v1/health/ready`: Readiness probe validating `mongoose.connection.readyState === 1`, returning HTTP 200 if database is active or HTTP 503 if disconnected.
  - `GET /api/v1/health`: Detailed subsystem health probe.

### 2.3 Database & Data Modeling (MongoDB Atlas)
- **Connection:** Managed through Mongoose with TLS encryption (`mongodb+srv://`) and fallback DNS resolution.
- **User Isolation (Zero-Trust):** All user resources (`Task`, `RoutineTemplate`, `WeeklyReview`, etc.) are partitioned strictly by `userId: ObjectId`. Database queries enforce ownership at the data-access layer to prevent IDOR / BOLA vulnerabilities.
- **Durable Scheduling:** Reminders are persisted in MongoDB with state tracking (`QUEUED`, `SENT`, `FAILED`) and polled by an in-process worker, ensuring notifications survive service restarts.

---

## 3. Authentication & Security Model

1. **Password Authentication:** Passwords hashed with `bcryptjs` using 12 salt rounds. Lockout mechanism activates after repeated failed attempts.
2. **Google OAuth 2.0:** Verified server-side using Google's official `google-auth-library`. Authorization codes are exchanged directly between Render and `oauth2.googleapis.com`. ID tokens are cryptographically validated against the client ID audience.
3. **Session Tokens:**
   - `ordo_access_token`: Short-lived JWT (15 minutes).
   - `ordo_refresh_token`: Long-lived JWT (7 days) tied to a server-side `tokenVersion` and `activeSessions` tracking list for instant revocation.
   - Flags: `HttpOnly: true`, `Secure: true`, `SameSite: none` (or `lax` on unified domains), `Path: /`.
4. **CSRF Protection:** Double-submit cookie with cryptographic verification, requiring matching `X-CSRF-Token` and Origin/Referer allowlist validation on all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
5. **NoSQL Injection Defense:** Middleware recursively inspects incoming request payloads and sanitizes MongoDB query operators (`$`).
6. **Rate Limiting:** Distinct rate-limiting tiers via `express-rate-limit`:
   - Auth endpoints (`/login`, `/register`, `/forgot-password`): 15 requests per 15 minutes.
   - General API endpoints: 500 requests per 15 minutes.
