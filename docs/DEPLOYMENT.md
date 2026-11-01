# ORDO — Deployment Manual

This guide outlines the verified, step-by-step deployment procedure for ORDO across **MongoDB Atlas**, **Render (Backend API)**, **Vercel (Frontend Next.js App)**, and **Google Cloud Console (OAuth 2.0)**.

---

## 1. Prerequisites Checklist
- [x] Codebase audited, hardened, and verified with 100% test pass rate.
- [ ] MongoDB Atlas cluster provisioned with database `ordo`.
- [ ] Render account connected to GitHub.
- [ ] Vercel account connected to GitHub.
- [ ] Google Cloud Console Web Application Client ID created.

---

## 2. Step 1: MongoDB Atlas Setup

1. **Log in to MongoDB Atlas** at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Cluster Creation**:
   - Ensure a cluster exists in your preferred cloud provider and region.
3. **Least-Privilege Database User**:
   - Navigate to **Security** &rarr; **Database Access** &rarr; **Add New Database User**.
   - Select **Password Authentication**.
   - Username: `ordo_app_user` (or your chosen application username).
   - Password: Generate a high-entropy 32-character password.
   - User Privileges: Select **Specific Privileges**:
     - Database: `ordo`
     - Collection: (leave blank for all collections in `ordo`)
     - Role: `readWrite`
   - *Never use Atlas Admin or Cluster Monitor accounts for application traffic.*
4. **Network Access**:
   - Navigate to **Security** &rarr; **Network Access** &rarr; **Add IP Address**.
   - For Render Web Services with dynamic outbound IPs:
     - IP Address: `0.0.0.0/0` (Allow Access from Anywhere)
     - Description: `Render Web Service Outbound`
     *(If upgraded to Render Team with static IPs, restrict strictly to Render's static outbound IP list).*
5. **Retrieve Connection String**:
   - Go to **Database** &rarr; **Connect** &rarr; **Drivers** &rarr; **Node.js**.
   - Copy URI:
     ```
     mongodb+srv://<username>:<password>@<cluster-host>/ordo?retryWrites=true&w=majority
     ```

---

## 3. Step 2: Render Backend Web Service Deployment

1. **Log in to Render** at [dashboard.render.com](https://dashboard.render.com).
2. **Create New Web Service**:
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository: `raahuldaksh/ordo` (or `ORDO`).
3. **Configure Service Details**:
   - **Name**: `ordo-backend` (creates `https://ordo-backend.onrender.com`).
   - **Region**: Choose region closest to your MongoDB Atlas cluster.
   - **Branch**: `master`
   - **Root Directory**: `backend` *(CRITICAL)*
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
4. **Health Check Configuration**:
   - **Health Check Path**: `/api/v1/health/ready` *(Returns 200 when MongoDB is connected, 503 if disconnected)*
   - **Auto-Deploy**: `Yes`
5. **Environment Variables**:
   Add the following variables (refer to [docs/ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)):
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://<your-vercel-domain>.vercel.app` *(update once Vercel domain is assigned)*
   - `COOKIE_SAME_SITE`: `none`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `SESSION_SECRET`: `<32-char-random-key>`
   - `ACCESS_TOKEN_SECRET`: `<32-char-random-key>`
   - `REFRESH_TOKEN_SECRET`: `<32-char-random-key>`
   - `GOOGLE_CLIENT_ID`: `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: `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`
   - `GOOGLE_CALLBACK_URL`: `https://ordo-backend.onrender.com/api/v1/auth/google/callback`
   - `GOOGLE_CALENDAR_REDIRECT_URL`: `https://ordo-backend.onrender.com/api/v1/calendar/google/callback`
   - `OAUTH_TOKEN_ENCRYPTION_KEY`: `<32-char-hex-key>`
   - `TRUST_PROXY`: `1`
6. Click **Create Web Service**. Verify deploy logs show:
   ```
   ORDO Backend API listening on 0.0.0.0:10000 (production mode)
   Connected to MongoDB Atlas: ordo
   ```

---

## 4. Step 3: Google Cloud Console Configuration

1. **Log in to Google Cloud Console** at [console.cloud.google.com](https://console.cloud.google.com).
2. **Select Project**: `ordo-planner-513318`.
3. **Configure Web Client Credentials**:
   - Navigate to **APIs & Services** &rarr; **Credentials**.
   - Click your Web Client ID (`984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c...`).
   - Under **Authorized JavaScript Origins**, add:
     - `https://<your-vercel-domain>.vercel.app`
     - Keep `http://localhost:3000` for local dev.
   - Under **Authorized Redirect URIs**, add:
     - `https://<your-render-service>.onrender.com/api/v1/auth/google/callback`
     - `https://<your-render-service>.onrender.com/api/v1/calendar/google/callback`
     - Keep `http://localhost:5000/api/v1/auth/google/callback` for local dev.
   - Save changes.
4. **OAuth Consent Screen**:
   - If app is in "Testing" mode, ensure your Google email is added to **Test users**.

---

## 5. Step 4: Vercel Frontend Deployment

1. **Log in to Vercel** at [vercel.com](https://vercel.com).
2. **Add New Project**:
   - Click **Add New...** &rarr; **Project**.
   - Import your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** &rarr; select `frontend` *(CRITICAL)*
   - **Build Command**: `next build` (Default)
   - **Output Directory**: `.next` (Default)
   - **Install Command**: `npm install` (Default)
4. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: `https://<your-project-name>.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-service>.onrender.com/api/v1`
   - `BACKEND_INTERNAL_URL`: `https://<your-render-service>.onrender.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: `984723086330-t8i36uj9votphgqpvmp2kd8n1ki16b3c.apps.googleusercontent.com`
5. Click **Deploy**. Vercel compiles static pages and outputs live domain (e.g. `https://ordo-app.vercel.app`).

---

## 6. Step 5: Final Cross-Service Alignment

1. In **Render Dashboard** &rarr; `ordo-backend` &rarr; **Environment**:
   - Set `FRONTEND_URL` to the assigned Vercel URL (e.g. `https://ordo-app.vercel.app`) without trailing slash.
   - Save changes to trigger zero-downtime rolling restart.

---

## 7. Post-Deployment Verification

1. Health Check:
   ```bash
   curl -i https://<render-host>/api/v1/health/ready
   # Expected: HTTP 200 OK, {"status":"ready","database":"connected"}
   ```
2. Frontend Check:
   - Navigate to `https://<vercel-host>/login`.
   - Test "Continue with Google" &rarr; consent screen loads &rarr; redirects to `/dashboard`.
   - Test email/password signup and login.
   - Create and schedule a task &rarr; verify persistence in MongoDB Atlas.

