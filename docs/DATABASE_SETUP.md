# ORDO — Database Setup Guide (MongoDB Atlas & Local)

This document provides instructions for configuring the database for ORDO.

---

## 1. MongoDB Atlas Setup (Recommended for Production)

### Step 1: Create a MongoDB Atlas Account & Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new organization and project (e.g., `ORDO-Production`).
3. Click **Build a Database** and select the **Shared (M0 Free)** or dedicated tier.
4. Choose your preferred cloud provider and closest region (e.g., AWS `ap-south-1` or `us-east-1`).
5. Name your cluster (default: `Cluster0`).

### Step 2: Create a Dedicated Database User
1. In the Atlas dashboard, navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Select **Password** as the authentication method.
4. Set Username: `ordo_app_user`.
5. Generate a secure password and save it securely.
6. Set Database User Privileges to **Read and write to any database** (or restrict to database `ordo`).
7. Click **Add User**.

> **Important:** If your password contains special characters (such as `@`, `:`, `/`, `?`, `#`, `[`, `]`), they **must** be URL-encoded in the connection string:
> - `@` becomes `%40`
> - `:` becomes `%3A`
> - `/` becomes `%2F`
> - `#` becomes `%23`

### Step 3: Configure Network Access (IP Whitelist)
1. In the Atlas dashboard, navigate to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. For local development, click **Add Current IP Address**.
4. For production hosting (Render, Railway, Fly.io), add your server's static outbound IP (or `0.0.0.0/0` with strong authentication credentials).
5. Click **Confirm**.

### Step 4: Get your Connection String
1. In Atlas, go to **Deployment** → **Database**.
2. Click **Connect** on your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string. It will look like:
   ```text
   mongodb+srv://ordo_app_user:<password>@cluster0.abcde.mongodb.net/ordo?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your database user password and ensure `/ordo` is specified as the database name.

### Step 5: Configure Backend `.env`
In `backend/.env`, set:
```env
MONGODB_URI=mongodb+srv://ordo_app_user:YourEncodedPassword@cluster0.abcde.mongodb.net/ordo?retryWrites=true&w=majority
```

---

## 2. In-Memory Local Development Fallback

For immediate local development and continuous testing without an active Atlas connection:
- If `MONGODB_URI` is omitted or set to `mongodb://localhost:27017/ordo` when a local mongod is unavailable, ORDO's backend will automatically start an embedded **In-Memory MongoDB Server** (`mongodb-memory-server`).
- This allows you to clone the repo, run `npm install`, and immediately execute tests or demo the full application end-to-end without any setup friction!

---

## 3. Database Collections & Indexing Plan

ORDO uses Mongoose schemas with indexes for high performance:

| Collection | Key Fields | Primary Indexes |
|---|---|---|
| `users` | `_id`, `email`, `passwordHash`, `googleId` | `{ email: 1 }` (unique) |
| `userPreferences` | `_id`, `userId`, `timezone`, `theme` | `{ userId: 1 }` (unique) |
| `tasks` | `_id`, `userId`, `scheduledStartAt`, `status`, `taskType` | `{ userId: 1, scheduledStartAt: 1 }`<br>`{ userId: 1, status: 1, scheduledStartAt: 1 }`<br>`{ userId: 1, taskType: 1, scheduledStartAt: 1 }` |
| `taskOutcomes` | `_id`, `userId`, `taskId`, `occurredAt` | `{ userId: 1, occurredAt: -1 }` |
| `routineTemplates` | `_id`, `userId`, `templateType` | `{ userId: 1, templateType: 1 }` |
| `routineTemplateItems` | `_id`, `templateId`, `userId`, `sortOrder` | `{ templateId: 1, sortOrder: 1 }` |
| `calendarConnections` | `_id`, `userId`, `provider` | `{ userId: 1, provider: 1 }` (unique) |
| `calendarEvents` | `_id`, `userId`, `providerEventId` | `{ userId: 1, providerEventId: 1 }` (unique) |
| `reminders` | `_id`, `userId`, `scheduledAt`, `status` | `{ status: 1, scheduledAt: 1 }`<br>`{ idempotencyKey: 1 }` (unique) |
| `notifications` | `_id`, `userId`, `readAt`, `createdAt` | `{ userId: 1, createdAt: -1 }` |
| `weeklyReviews` | `_id`, `userId`, `weekStartDate` | `{ userId: 1, weekStartDate: 1 }` (unique) |
| `aiInsights` | `_id`, `userId`, `createdAt` | `{ userId: 1, createdAt: -1 }` |

---

## 4. Verifying Connectivity

You can test database connectivity at any time:
```bash
curl http://localhost:5000/api/v1/health
```
Response:
```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "name": "ordo"
  },
  "timestamp": "2026-11-01T09:00:00.000Z"
}
```
Credentials are never exposed in the health endpoint.

