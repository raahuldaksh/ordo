# ORDO Production Security Architecture & Hardening Guide

## 1. Executive Summary & Zero-Trust Principles
ORDO is designed with a defense-in-depth, Zero-Trust posture where the backend API is the sole authoritative gatekeeper for data confidentiality, authorization, and integrity. The frontend user interface serves as a presentation layer; no client-side assertion or state is trusted implicitly.

### Core Security Principles:
1. **Backend as Sole Authority**: Every state-changing request and read is validated against authenticated session context and database state.
2. **Never Store Plaintext Secrets**: Passwords are saved as bcrypt hashes; reset tokens, email verification tokens, and OAuth tokens are hashed with SHA-256 or encrypted via AES-256-GCM.
3. **Instantaneous Session Invalidation**: Changing passwords or revoking sessions triggers an atomic increment of `tokenVersion`, instantly invalidating all issued JWT access tokens without waiting for TTL expiry.
4. **Mandatory Re-Authentication**: Highly sensitive operations (account deletion, full personal data export) require explicit password confirmation.
5. **Least Privilege & Strict Allowlisting**: Endpoints accept only explicitly allowlisted parameters, eliminating mass assignment and privilege escalation vulnerabilities.

---

## 2. Threat Model & Mitigations Matrix

| Attack Vector | Vulnerability Category | Mitigation Implemented |
|---|---|---|
| **Insecure Direct Object Reference (IDOR)** | Broken Access Control | All queries filter by `userId: req.user.userId`. Task/Routine IDs validated via `Types.ObjectId.isValid()`. Cross-user access returns `404 Not Found`. |
| **NoSQL Operator Injection** | Injection | Recursive `noSqlSanitize` middleware strips all keys containing `$` (e.g. `$gt`, `$ne`, `$where`) or `.` notation from `body`, `params`, and `query`. |
| **Cross-Site Request Forgery (CSRF)** | Session Management | Double-submit cookie architecture with `ordo_csrf_token` cookie + `X-CSRF-Token` header. Strict Origin/Referer verification against domain allowlist for all mutation methods (`POST`, `PATCH`, `DELETE`, `PUT`). |
| **Mass Assignment & Parameter Tampering** | Improper Data Handling | Strict object picking/allowlists in controllers (`userController`, `taskService`, `routineService`). Client cannot inject `tokenVersion`, `accountStatus`, or `userId`. |
| **Credential Stuffing & Brute Force** | Broken Authentication | Strict 12+ char password policy (min 12, uppercase, lowercase, number). Progressive account lockout after 5 consecutive failures (15 min lock). Rate limiting via `authLimiter`. |
| **Session Hijacking / Replay** | Broken Authentication | Short-lived access tokens (15m). `tokenVersion` stored in DB and checked on every authenticated request. Refresh tokens stored in `HttpOnly`, `SameSite=lax` cookies. |
| **Token Exposure at Rest** | Sensitive Data Exposure | SHA-256 cryptographic hashing (`hashToken`) applied to all password reset tokens before persistence. Plaintext tokens never exist in MongoDB. |
| **Sensitive Data Exposure in Logs** | Security Logging Failures | Winston logger redaction pipeline masks `password`, `token`, `cookie`, `authorization`, `description`, `actualReason`, and JWT payloads. |

---

## 3. Implemented Security Controls

### 3.1 Authentication & Password Policy
- **Password Complexity**: Enforced by Zod schema (`backend/src/validators/auth.ts`):
  - Minimum 12 characters, maximum 128 characters
  - At least one uppercase letter `[A-Z]`
  - At least one lowercase letter `[a-z]`
  - At least one number `[0-9]`
- **Bcrypt Hashing**: `bcrypt.hash(password, 10)` with salt factor 10.
- **Timing Safe Validation**: Rejection pathways for non-existent users perform a dummy hash compare to prevent timing-based user enumeration.
- **Progressive Account Lockout**:
  - `failedLoginAttempts` tracked in `User` model.
  - After 5 consecutive failed attempts, `lockUntil` is set to `Date.now() + 15 minutes`.
  - Rejection with HTTP 429 (`ACCOUNT_TEMPORARILY_LOCKED`).

### 3.2 Token Lifecycle & Session Revocation
- **JWT Architecture**:
  - `accessToken`: 15-minute lifespan. Payload includes `{ userId, email, tokenVersion, sessionId }`.
  - `refreshToken`: 7-day lifespan. Stored in `HttpOnly`, `SameSite=lax` cookie (`ordo_refresh_token`).
- **Token Version Invalidation**:
  - `User.tokenVersion` integer increments on:
    - Password change (`POST /api/v1/auth/change-password`)
    - Password reset (`POST /api/v1/auth/reset-password`)
    - Global session revocation (`POST /api/v1/auth/sessions/revoke-all`)
  - `requireAuth` middleware verifies `payload.tokenVersion >= user.tokenVersion`. Old tokens return HTTP 401 `SESSION_REVOKED`.

### 3.3 Plaintext Token Defense (SHA-256 at Rest)
- When a user requests `POST /api/v1/auth/forgot-password`:
  - 64-character cryptographic random token generated via `crypto.randomBytes(32).toString('hex')`.
  - Stored in database as `SHA256(token)` in `resetPasswordTokenHash`.
  - Plaintext token sent only to user's verified email.
  - Reset request (`POST /api/v1/auth/reset-password`) hashes incoming plaintext token and matches against DB hash.

### 3.4 Cross-Site Request Forgery (CSRF) & Origin Defense
- Non-idempotent HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) with cookie credentials require:
  1. Valid `ordo_csrf_token` cookie.
  2. Matching `X-CSRF-Token` header.
  3. `Origin` or `Referer` matching approved hostnames (`config.frontendUrl`, `localhost:3000`, `127.0.0.1:3000`).

### 3.5 Re-Authentication for Critical Actions
- **Account Deletion (`DELETE /api/v1/users/me`)**:
  - Requires `{ password: "..." }` in request body.
  - Missing password returns HTTP 401 `REAUTHENTICATION_REQUIRED`.
  - Incorrect password returns HTTP 401 `INVALID_PASSWORD`.
  - On verification, cascades permanent deletion of user document, preferences, tasks, outcomes, routine templates, calendar connections, reminders, notifications, and reviews.
- **Personal Data Export (`POST /api/v1/users/me/export`)**:
  - Requires `{ password: "..." }` in request body.
  - Returns complete sanitized JSON archive omitting all credential hashes.

### 3.6 HTTP Security Headers & Rate Limiting
- **Helmet Headers**:
  - `Content-Security-Policy`: Default `'self'`, scripts `'self'`, styles `'self' 'unsafe-inline'`, frame-ancestors `'none'`.
  - `X-Frame-Options`: `DENY` (clickjacking prevention).
  - `X-Content-Type-Options`: `nosniff`.
  - `Strict-Transport-Security` (HSTS): Enabled in production (`maxAge: 31536000`, `includeSubDomains: true`).
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
- **Rate Limiters**:
  - `authLimiter`: Max 15 attempts / 15 mins for `/register`, `/login`, `/google`.
  - `passwordResetLimiter`: Max 5 requests / hour.
  - `generalApiLimiter`: Max 500 requests / 15 mins per IP.
  - `aiLimiter`: Max 20 analyses / hour.

---

## 4. Verification & Automated Test Coverage

The security posture is continuously validated via the automated security test suite located at `backend/tests/security.test.ts`.

### Test Coverage (25 Automated Security Tests):
1. **Password Validation**: Rejection of passwords < 12 characters, passwords without numbers, and passwords without uppercase letters.
2. **Token Storage**: Verification that MongoDB documents contain only 64-char SHA-256 hex hashes and never plaintext recovery tokens.
3. **Session Revocation**: Proof that changing passwords immediately revokes existing tokens across all devices (`SESSION_REVOKED`).
4. **Account Lockout**: Proof that 5 consecutive failed logins set `lockUntil` in MongoDB and reject subsequent attempts with HTTP 429 `ACCOUNT_TEMPORARILY_LOCKED`.
5. **CSRF Protection**: Verification that cookie mutations without `X-CSRF-Token` fail with HTTP 403 `CSRF_TOKEN_MISMATCH`, untrusted origins fail with HTTP 403 `CSRF_INVALID_ORIGIN`, and valid tokens succeed.
6. **NoSQL Sanitization**: Proof that nested MongoDB operators (`$gt`, `$ne`, etc.) are stripped from request bodies.
7. **Mass Assignment**: Proof that requests attempting to inject `tokenVersion`, `accountStatus`, or admin roles cannot escalate privileges.
8. **IDOR Isolation**: Verification that User B cannot read, update, change status of, or delete User A's tasks or routines.
9. **Re-Authentication**: Proof that data export and account deletion require valid password verification and reject unverified requests.

To execute the security test suite:
```bash
cd backend
npm test tests/security.test.ts
```

---

## 5. Security Incident Response Runbook

### Scenario A: Compromised User Credentials / Stolen Session
1. User or security admin executes **Global Session Revocation**:
   ```http
   POST /api/v1/auth/sessions/revoke-all
   Authorization: Bearer <token>
   ```
2. Or trigger a password reset flow (`/api/v1/auth/forgot-password`).
3. This increments `user.tokenVersion`, immediately invalidating all active JWTs on every server and device.

### Scenario B: Suspected Account Lockout / DDoS Against Specific Account
1. Query user status in MongoDB:
   ```javascript
   db.users.findOne({ email: "user@example.com" }, { failedLoginAttempts: 1, lockUntil: 1 })
   ```
2. Clear lock if verified as legitimate user unlock request:
   ```javascript
   db.users.updateOne({ email: "user@example.com" }, { $set: { failedLoginAttempts: 0, lockUntil: null } })
   ```

### Scenario C: Secret Key Rotation (JWT / Session Secrets)
1. Generate new 32+ byte secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update environment variables `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.
3. Perform rolling backend restart. All existing tokens will fail signature verification, prompting users to re-authenticate cleanly.

