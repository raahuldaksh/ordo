import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User, Task } from '../src/models/index.js';
import { TaskType, TaskPriority, TaskStatus } from '../src/constants/enums.js';

let mongod: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'ordo-security-test' } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('ORDO Security Hardening Test Suite', () => {
  const userA = {
    fullName: 'Alice Security',
    email: 'alice@security.ordo.app',
    password: 'InitialPassword123'
  };

  const userB = {
    fullName: 'Bob Attacker',
    email: 'bob@security.ordo.app',
    password: 'AttackerPassword123'
  };

  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let taskAId: string;

  // 1. Password Complexity
  describe('Password Complexity & Validation', () => {
    it('rejects passwords shorter than 12 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Short Pass',
          email: 'short@ordo.app',
          password: 'Pass1'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects passwords without numbers', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'No Number Pass',
          email: 'nonumber@ordo.app',
          password: 'PasswordWithoutNumbers'
        });

      expect(res.status).toBe(422);
    });

    it('rejects passwords without uppercase letters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'No Upper Pass',
          email: 'noupper@ordo.app',
          password: 'passwordwithnumbers123'
        });

      expect(res.status).toBe(422);
    });
  });

  // Setup user A & B
  describe('User Provisioning', () => {
    it('registers User A with compliant credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userA);

      expect(res.status).toBe(201);
      tokenA = res.body.data.tokens.accessToken;
      userAId = res.body.data.user.id;
    });

    it('registers User B with compliant credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userB);

      expect(res.status).toBe(201);
      tokenB = res.body.data.tokens.accessToken;
    });
  });

  // 2. Plaintext Tokens Never Stored at Rest (SHA-256 Hashing)
  describe('Plaintext Token Storage & Reset Flow', () => {
    let devResetToken: string;

    it('generates a reset token and stores only its SHA-256 hash in DB', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: userA.email });

      expect(res.status).toBe(200);
      expect(res.body.data.devResetToken).toBeDefined();
      devResetToken = res.body.data.devResetToken;

      // Direct inspection of MongoDB document
      const userInDb = await User.findOne({ email: userA.email });
      expect(userInDb).not.toBeNull();
      expect(userInDb!.resetPasswordTokenHash).toBeDefined();

      // Ensure the plaintext token itself is NEVER present in the document
      expect(userInDb!.resetPasswordTokenHash).not.toBe(devResetToken);
      // SHA-256 hex string is exactly 64 characters
      expect(userInDb!.resetPasswordTokenHash).toHaveLength(64);
    });

    it('accepts the valid plaintext token to reset password, then clears hash', async () => {
      const newPassword = 'NewSecretPassword456';
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: devResetToken,
          password: newPassword
        });

      expect(res.status).toBe(200);

      // Verify the reset hash is wiped from DB
      const userInDb = await User.findOne({ email: userA.email });
      expect(userInDb!.resetPasswordTokenHash).toBeFalsy();

      // Update local credentials
      userA.password = newPassword;
    });
  });

  // 3. Token Version Invalidation on Password Change
  describe('Token Version Invalidation & Immediate Session Revocation', () => {
    let activeToken: string;

    it('logs in and verifies authenticated session works', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userA.email,
          password: userA.password
        });

      expect(loginRes.status).toBe(200);
      activeToken = loginRes.body.data.tokens.accessToken;

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(userA.email);
    });

    it('invalidates existing tokens when password is changed', async () => {
      const updatedPassword = 'FinalStrongPassword789';

      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${activeToken}`)
        .send({
          currentPassword: userA.password,
          newPassword: updatedPassword
        });

      expect(changeRes.status).toBe(200);

      // Previous token must now be rejected because tokenVersion incremented
      const revokedRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(revokedRes.status).toBe(401);
      expect(revokedRes.body.error.code).toBe('SESSION_REVOKED');

      userA.password = updatedPassword;

      // Logging in again issues a fresh token that works
      const freshLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userA.email,
          password: userA.password
        });

      expect(freshLogin.status).toBe(200);
      tokenA = freshLogin.body.data.tokens.accessToken;
    });
  });

  // 4. Progressive Account Lockout
  describe('Progressive Account Lockout Defense', () => {
    it('locks account after 5 consecutive failed login attempts', async () => {
      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: userA.email,
            password: 'WrongPassword999'
          });

        expect(res.status).toBe(401);
      }

      // Check DB state: lockUntil is set and failedLoginAttempts >= 5
      const userInDb = await User.findOne({ email: userA.email });
      expect(userInDb!.failedLoginAttempts).toBeGreaterThanOrEqual(5);
      expect(userInDb!.lockUntil).toBeDefined();
      expect(new Date(userInDb!.lockUntil!).getTime()).toBeGreaterThan(Date.now());

      // Attempting to log in with correct password is also rejected while locked
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userA.email,
          password: userA.password
        });

      expect(lockedRes.status).toBe(429);
      expect(lockedRes.body.error.code).toBe('ACCOUNT_TEMPORARILY_LOCKED');
      expect(lockedRes.body.error.message).toMatch(/Account is temporarily locked/i);

      // Unlock user in DB for remaining tests
      await User.updateOne(
        { email: userA.email },
        { $set: { failedLoginAttempts: 0, lockUntil: undefined } }
      );
    });
  });

  // 5. Double-Submit Cookie CSRF Protection
  describe('CSRF Protection for Cookie-Authenticated Mutations', () => {
    it('rejects cookie-authenticated mutation without x-csrf-token header', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`ordo_access_token=${tokenA}`])
        .send({
          title: 'CSRF Attempt Task',
          taskType: TaskType.FIXED,
          priority: TaskPriority.MEDIUM,
          scheduledStartAt: '2026-11-01T12:00:00.000Z',
          scheduledEndAt: '2026-11-01T13:00:00.000Z',
          durationMinutes: 60
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_TOKEN_MISMATCH');
    });

    it('rejects cookie-authenticated mutation with untrusted origin', async () => {
      const csrfToken = 'test-csrf-token-12345';
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`ordo_access_token=${tokenA}`, `ordo_csrf_token=${csrfToken}`])
        .set('Origin', 'https://malicious-site.evil.com')
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Evil Origin Task',
          taskType: TaskType.FIXED,
          priority: TaskPriority.MEDIUM,
          scheduledStartAt: '2026-11-01T12:00:00.000Z',
          scheduledEndAt: '2026-11-01T13:00:00.000Z',
          durationMinutes: 60
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_INVALID_ORIGIN');
    });

    it('allows cookie-authenticated mutation with valid csrf token and matching origin', async () => {
      const csrfToken = 'test-valid-csrf-token';
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`ordo_access_token=${tokenA}`, `ordo_csrf_token=${csrfToken}`])
        .set('Origin', 'http://localhost:3000')
        .set('x-csrf-token', csrfToken)
        .send({
          title: 'Legitimate Protected Task',
          taskType: TaskType.FIXED,
          priority: TaskPriority.MEDIUM,
          scheduledStartAt: '2026-11-01T14:00:00.000Z',
          scheduledEndAt: '2026-11-01T15:00:00.000Z',
          durationMinutes: 60
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Legitimate Protected Task');
      taskAId = res.body.data._id;
    });
  });

  // 6. NoSQL Injection Sanitization
  describe('NoSQL Injection Payload Sanitization', () => {
    it('strips keys with $ prefix from incoming payload', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $gt: '' },
          password: 'Password123'
        });

      // The $gt property was sanitized out, causing validation error rather than injection
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // 7. Mass Assignment Defense
  describe('Mass Assignment Defense', () => {
    it('prevents privilege or tokenVersion escalation on updateMe', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          fullName: 'Alice Verified Name',
          tokenVersion: 9999,
          accountStatus: 'SUSPENDED',
          failedLoginAttempts: 100,
          role: 'superuser'
        });

      expect(res.status).toBe(200);

      // Verify in MongoDB that protected fields were NOT modified
      const userInDb = await User.findById(userAId);
      expect(userInDb!.fullName).toBe('Alice Verified Name');
      expect(userInDb!.tokenVersion).not.toBe(9999);
      expect(userInDb!.accountStatus).toBe('ACTIVE');
      expect((userInDb as any).role).toBeUndefined();
    });
  });

  // 8. IDOR Prevention (Cross-User Isolation)
  describe('Insecure Direct Object Reference (IDOR) Isolation', () => {
    it('prevents User B from accessing User A task by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TASK_NOT_FOUND');
    });

    it('prevents User B from updating User A task', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked by Bob' });

      expect(res.status).toBe(404);

      // Verify task in DB remains unchanged
      const task = await Task.findById(taskAId);
      expect(task!.title).toBe('Legitimate Protected Task');
    });

    it('prevents User B from updating status of User A task', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${taskAId}/status`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          status: TaskStatus.FAILED,
          note: 'Bob tried to mark this failed'
        });

      expect(res.status).toBe(404);
    });

    it('prevents User B from deleting User A task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);

      // Task still exists
      const task = await Task.findById(taskAId);
      expect(task).not.toBeNull();
    });
  });

  // 9. Re-Authentication Requirement
  describe('Re-Authentication for Sensitive Operations', () => {
    it('rejects data export without password confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/export')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
    });

    it('rejects data export with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/export')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: 'IncorrectPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('permits data export with valid password confirmation', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/export')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: userA.password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(userA.email);
      expect(res.body.data.tasks).toBeDefined();
    });

    it('rejects account deletion without password confirmation', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('REAUTHENTICATION_REQUIRED');
    });

    it('rejects account deletion with incorrect password', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: 'WrongPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('permanently deletes account and cascades task deletion on valid password', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ password: userA.password });

      expect(res.status).toBe(200);

      // Verify User A and all associated tasks are completely purged
      const deletedUser = await User.findById(userAId);
      expect(deletedUser).toBeNull();

      const orphanedTasks = await Task.find({ userId: userAId });
      expect(orphanedTasks).toHaveLength(0);
    });
  });
});
