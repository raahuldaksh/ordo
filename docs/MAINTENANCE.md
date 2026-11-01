# ORDO — Maintenance, Operations & Incident Runbook

This document details ongoing operations, monitoring, secret rotation, incident response, and disaster recovery procedures for the ORDO production deployment.

---

## 1. Health Monitoring & Health Probes

### 1.1 Endpoint Specifications
- **Liveness Probe**: `https://<render-service>.onrender.com/api/v1/health/live`
  - Validates that the Express web application process is responsive.
  - Expected: HTTP `200 OK`, `{"status":"ok"}`.
- **Readiness Probe**: `https://<render-service>.onrender.com/api/v1/health/ready`
  - Validates that the application is connected to MongoDB Atlas (`readyState === 1`).
  - Expected when operational: HTTP `200 OK`, `{"status":"ready","database":"connected"}`.
  - Expected when degraded: HTTP `503 Service Unavailable`, `{"status":"unready","database":"disconnected"}`.
- **Detailed System Health**: `https://<render-service>.onrender.com/api/v1/health`

### 1.2 Automated Uptime Monitoring
Set up an external uptime monitor (e.g., Better Stack, UptimeRobot, or Pingdom):
- **Target URL**: `https://<render-service>.onrender.com/api/v1/health/ready`
- **Interval**: Every 60 seconds (prevents Render free tier services from idling).
- **Threshold**: Alert if 2 consecutive probes fail with status != 200.

---

## 2. Rollback Procedures

### 2.1 Backend Rollback (Render)
1. Navigate to **Render Dashboard** &rarr; Select `ordo-backend`.
2. Click on the **Deploys** tab.
3. Identify the last known stable deployment.
4. Click the options menu (`...`) &rarr; **Rollback to this deploy**.
5. Render immediately spins up the previous container build with zero downtime.

### 2.2 Frontend Rollback (Vercel)
1. Navigate to **Vercel Dashboard** &rarr; Select `ordo-frontend`.
2. Click on the **Deployments** tab.
3. Identify the previous working deployment.
4. Click the options menu (`...`) &rarr; **Instant Rollback**.
5. Traffic is instantaneously routed back to the previous deployment build.

---

## 3. Secret Rotation Procedures

### 3.1 JWT Token Secrets (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`)
- **When to rotate**: Key compromise, scheduled quarterly rotation, or emergency token invalidation.
- **Procedure**:
  1. Generate new 32-character hex secret:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
  2. In Render Dashboard &rarr; **Environment** &rarr; Update `ACCESS_TOKEN_SECRET` or `REFRESH_TOKEN_SECRET`.
  3. Click **Save Changes**. Render triggers a rolling deployment.
  4. *Note: Existing sessions will be invalidated, prompting users to log in again safely.*

### 3.2 MongoDB Atlas Credentials (`MONGODB_URI`)
1. In MongoDB Atlas &rarr; **Database Access** &rarr; Create a new user (or update password on `ordo_app_user`).
2. Test connection with the new string locally.
3. In Render Dashboard &rarr; **Environment** &rarr; Update `MONGODB_URI`.
4. Save and trigger deployment.
5. In MongoDB Atlas, remove the old user credentials.

### 3.3 Google OAuth Client Secret (`GOOGLE_CLIENT_SECRET`)
1. In Google Cloud Console &rarr; **APIs & Services** &rarr; **Credentials** &rarr; Web Client ID.
2. Click **Add secret** &rarr; copy new secret.
3. Update `GOOGLE_CLIENT_SECRET` in Render.
4. Verify Google Login &rarr; delete the old secret in Google Cloud Console.

---

## 4. Disaster Recovery & Backup Plan

### 4.1 Automated Backups
- MongoDB Atlas provides continuous automated backups on dedicated clusters (M10+) and daily snapshots on shared tiers.
- Verify snapshot schedule under MongoDB Atlas &rarr; **Backup**.

### 4.2 Manual Backup (`mongodump`)
To create an offline JSON/BSON backup snapshot before major migrations:
```bash
mongodump --uri="mongodb+srv://<user>:<password>@<host>/ordo?retryWrites=true&w=majority" --out="./backup_ordo_$(date +%Y%m%d)"
```

### 4.3 Restore Procedure (`mongorestore`)
To restore from a backup snapshot:
```bash
mongorestore --uri="mongodb+srv://<user>:<password>@<host>/ordo?retryWrites=true&w=majority" --drop "./backup_ordo_20261101/ordo"
```
*(Caution: The `--drop` flag replaces existing collections with snapshot data. Always test restore on a staging database first).*

---

## 5. Outage Response Playbooks

### Scenario A: Database Connection Failure
- **Symptoms**: `/api/v1/health/ready` returns HTTP 503. API logs show `MongooseServerSelectionError`.
- **Diagnosis**: Check if MongoDB Atlas is undergoing maintenance or if client IP was revoked.
- **Remediation**: Check Atlas status. Confirm Network Access has `0.0.0.0/0` (for Render standard tiers) or current static IPs.

### Scenario B: Google OAuth Fails (`redirect_uri_mismatch`)
- **Symptoms**: User clicks "Continue with Google" and receives an error `400 redirect_uri_mismatch`.
- **Remediation**: Verify that `GOOGLE_CALLBACK_URL` in Render exactly matches the registered URI in Google Cloud Console (including `https://` protocol and no trailing slash).
