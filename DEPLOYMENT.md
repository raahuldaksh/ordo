# ORDO — Production Deployment Manual

This guide outlines the verified, step-by-step deployment procedure for ORDO across **MongoDB Atlas**, **Render (Backend API)**, **Vercel (Frontend Next.js App)**, and **Google Cloud Console (OAuth 2.0)**.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             User Web Browser                 │
                      └──────────────┬───────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           │                                                   │
           ▼ (HTTPS / Top-level Navigation)                     ▼ (HTTPS / API & Static Assets)
┌──────────────────────────────────────┐             ┌──────────────────────────────────┐
│        Google Cloud Identity         │             │         Vercel Edge CDN          │
│  OAuth 2.0 Consent & Token Issuer    │             │   Frontend (Next.js 14 App)      │
│  accounts.google.com                 │             │   https://ordo-app.vercel.app    │
└──────────────────┬───────────────────┘             └─────────────────┬────────────────┘
                   │                                                   │
                   │ (Authorization Code Redirect)                     │ (CORS / Cookies / Rewrites)
                   ▼                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                Render Web Service                                     │
│                            Backend API (Node.js 20+)                                  │
│                      https://ordo-backend.onrender.com                                │
│                                                                                       │
│  - Express REST API (/api/v1)                                                         │
│  - Zero-Trust Token Verification (google-auth-library)                                │
│  - Secure HttpOnly SameSite=None Cookies                                              │
│  - In-process Durable Reminder Dispatcher                                             │
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │
                                           │ (TLS Encrypted Mongoose Connection)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                 MongoDB Atlas                                         │
│                          M0 Free Tier / M10 Dedicated                                 │
│  - Database: 'ordo'                                                                   │
│  - Application User: readWrite on 'ordo'                                              │
│  - Collections: users, tasks, taskoutcomes, routinetemplates, reminders, etc.         │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: MongoDB Atlas Setup

1. **Log in to MongoDB Atlas** at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Select or Create Cluster**:
   - Cluster Name: e.g. `ordo-cluster` or your existing cluster.
   - Cloud Provider & Region: Select AWS / GCP region closest to your Render service (e.g. `us-east-1` Frankfurt, or Oregon).
3. **Create Database User (Least Privilege)**:
   - Navigate to **Security** &rarr; **Database Access** &rarr; **Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `ordo_app_user` (or your existing application user).
   - Password: Autogenerate a secure 32-character password (store securely in password manager).
   - Database User Privileges: Select **Built-in Role** &rarr; **Read and write to any database** OR choose **Specific Privileges**:
     - Database: `ordo`
     - Collection: (leave blank for all collections in `ordo`)
     - Role: `readWrite`
   - *Never use Atlas Admin or Cluster Monitor accounts for application traffic.*
4. **Configure Network Access**:
   - Navigate to **Security** &rarr; **Network Access** &rarr; **Add IP Address**.
   - Because Render Web Services use dynamic outbound IP addresses on standard tiers, add:
     - IP Address: `0.0.0.0/0` (Allow Access from Anywhere)
     - Description: `Render Web Service Dynamic Outbound`
     *(Note: If upgraded to Render Dedicated Team with Static Outbound IPs, restrict this strictly to Render's static IPs).*
5. **Retrieve Connection String**:
   - Go to **Database** &rarr; **Connect** &rarr; **Drivers** &rarr; **Node.js** (`version 5.5 or later`).
   - Copy the SRV URI:
     ```
     mongodb+srv://<db_username>:<db_password>@cluster0.abcde.mongodb.net/ordo?retryWrites=true&w=majority
     ```
   - Ensure the database name `/ordo` is appended before the query string `?retryWrites=true`.

---

## Step 2: Render Backend Web Service Deployment

1. **Log in to Render** at [dashboard.render.com](https://dashboard.render.com).
2. **Create New Web Service**:
   - Click **New +** &rarr; **Web Service**.
   - Connect your Git repository containing the ORDO repository (`master` or `main` branch).
3. **Configure Service Details**:
   - **Name**: `ordo-backend` (creates `https://ordo-backend.onrender.com`)
   - **Region**: Choose the region closest to your MongoDB Atlas cluster (e.g., Oregon US-West or Frankfurt).
   - **Branch**: `master` (or `main`)
   - **Root Directory**: `backend` *(CRITICAL: Must be set to `backend`)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free` or `Starter`
4. **Configure Advanced Settings**:
   - **Health Check Path**: `/api/v1/health/ready` *(Returns 200 when MongoDB is connected, 503 if disconnected)*
   - **Auto-Deploy**: `Yes`
5. **Configure Environment Variables** (under **Environment** tab):
   Add the following exact key-value pairs (refer to [PRODUCTION_ENVIRONMENT_VARIABLES.md](file:///c:/Users/rahul/OneDrive/Desktop/ORDO/PRODUCTION_ENVIRONMENT_VARIABLES.md)):
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://<your-vercel-domain>.vercel.app` *(update once Vercel domain is assigned)*
   - `COOKIE_SAME_SITE`: `none`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `SESSION_SECRET`: `<generated-32-char-random-key>`
   - `ACCESS_TOKEN_SECRET`: `<generated-32-char-random-key>`
   - `REFRESH_TOKEN_SECRET`: `<generated-32-char-random-key>`
   - `GOOGLE_CLIENT_ID`: `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: `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`
   - `GOOGLE_CALLBACK_URL`: `https://ordo-backend.onrender.com/api/v1/auth/google/callback`
   - `GOOGLE_CALENDAR_REDIRECT_URL`: `https://ordo-backend.onrender.com/api/v1/calendar/google/callback`
   - `OAUTH_TOKEN_ENCRYPTION_KEY`: `<generated-32-char-key>`
   - `TRUST_PROXY`: `1`
6. **Trigger Deployment**:
   - Click **Create Web Service**.
   - Monitor the deploy logs. Verify it outputs:
     ```
     ORDO Backend API listening on 0.0.0.0:10000 (production mode)
     Connected to MongoDB Atlas: ordo
     ```
   - Copy your live backend hostname: e.g. `https://ordo-backend.onrender.com`.

---

## Step 3: Google Cloud Console Configuration

1. **Log in to Google Cloud Console** at [console.cloud.google.com](https://console.cloud.google.com).
2. **Select Project**: `ordo-planner-513318` (or your active project ID).
3. **Update OAuth 2.0 Client ID**:
   - Navigate to **APIs & Services** &rarr; **Credentials**.
   - Under **OAuth 2.0 Client IDs**, click the Web Client ID (ending with `...1ki16b3c`).
   - Under **Authorized JavaScript Origins**, add:
     - `https://<your-vercel-domain>.vercel.app`
     - Keep `http://localhost:3000` for local development.
   - Under **Authorized Redirect URIs**, add:
     - `https://<your-render-service>.onrender.com/api/v1/auth/google/callback`
     - `https://<your-render-service>.onrender.com/api/v1/calendar/google/callback`
     - Keep `http://localhost:5000/api/v1/auth/google/callback` for local development.
   - Click **Save**.
4. **Verify OAuth Consent Screen**:
   - Navigate to **APIs & Services** &rarr; **OAuth consent screen**.
   - App Name: `ORDO Planner`
   - User Support Email: your verified email.
   - Developer Contact Information: your verified email.
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Publishing Status:
     - If in **Testing**: Ensure all test users who need to log in are added under **Test users**.
     - To allow any Google user to log in: Submit for verification or click **Publish App**.

---

## Step 4: Vercel Frontend Deployment

1. **Log in to Vercel** at [vercel.com](https://vercel.com).
2. **Add New Project**:
   - Click **Add New...** &rarr; **Project**.
   - Import your ORDO Git repository.
3. **Configure Build & Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** &rarr; select `frontend` *(CRITICAL: Must be set to `frontend`)*
   - **Build Command**: `next build` (Default)
   - **Output Directory**: `.next` (Default)
   - **Install Command**: `npm install` (Default)
4. **Configure Environment Variables** (under **Environment Variables**):
   - `NEXT_PUBLIC_APP_URL`: `https://<your-project-name>.vercel.app` (e.g. `https://ordo-app.vercel.app`)
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-service>.onrender.com/api/v1`
   - `BACKEND_INTERNAL_URL`: `https://<your-render-service>.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com`
   *(Assign these to **Production**, **Preview**, and **Development** scopes).*
5. **Deploy**:
   - Click **Deploy**.
   - Vercel will install dependencies, typecheck, compile static pages, and assign your live URL (e.g. `https://ordo-app.vercel.app`).

---

## Step 5: Final Cross-Service Alignment

1. Return to **Render Dashboard** &rarr; `ordo-backend` &rarr; **Environment**.
2. Verify that `FRONTEND_URL` exactly matches your assigned Vercel URL (e.g. `https://ordo-app.vercel.app`) without trailing slash.
3. Save changes in Render to trigger an automatic zero-downtime redeploy.

---

## Step 6: Post-Deployment Smoke Verification

1. **Backend Health Verification**:
   ```bash
   curl -i https://<your-render-service>.onrender.com/api/v1/health/ready
   # Expected: HTTP 200 OK, {"status":"ready","database":"connected"}
   ```
2. **Frontend Liveness**:
   - Open `https://<your-vercel-domain>.vercel.app` in an incognito browser window.
   - Verify landing page loads with zero console errors.
3. **Authentication Journey**:
   - Register a new account via email and password &rarr; redirected to `/onboarding` &rarr; `/dashboard`.
   - Test "Continue with Google" &rarr; consent screen loads &rarr; redirects to `/dashboard`.
   - Log out &rarr; cookies cleared &rarr; redirected to `/login`.
4. **Core Planner Flow**:
   - Create a task with title, time, priority, and energy level.
   - Reschedule or update status (Completed / Failed with Reason Category).
   - Verify dashboard metrics update accurately.
