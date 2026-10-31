import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { TaskStatus, TaskType, ReasonCategory, TaskPriority } from '../src/constants/enums.js';

let mongod: MongoMemoryServer;
let app: any;
let authToken: string;
let userId: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ instance: { dbName: 'ordo-test' } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('ORDO Backend API Suite', () => {
  it('GET /api/v1/health reports system status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.status).toBe('connected');
  });

  it('POST /api/v1/auth/register creates a user and returns access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@ordo.app',
        password: 'SecurePass1234'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('test@ordo.app');
    authToken = res.body.data.tokens.accessToken;
    userId = res.body.data.user.id;
  });

  it('POST /api/v1/auth/login authenticates with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@ordo.app',
        password: 'SecurePass1234'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/me returns current user details and preferences', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test@ordo.app');
    expect(res.body.data.preferences).toBeDefined();
  });

  let createdTaskId: string;

  it('POST /api/v1/tasks creates a new scheduled task', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Deep Work: System Architecture',
        description: 'Design database and API schemas',
        taskType: TaskType.FIXED,
        priority: TaskPriority.HIGH,
        scheduledStartAt: '2026-11-01T09:00:00.000Z',
        scheduledEndAt: '2026-11-01T11:00:00.000Z',
        durationMinutes: 120,
        tags: ['architecture', 'ordo']
      });

    expect(res.status).toBe(201);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Deep Work: System Architecture');
    expect(res.body.data.status).toBe(TaskStatus.PENDING);
    createdTaskId = res.body.data._id;
  });

  it('POST /api/v1/tasks/:id/status records FAILED outcome with reasonCategory and actualReason', async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${createdTaskId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: TaskStatus.FAILED,
        reasonCategory: ReasonCategory.DISTRACTION,
        actualReason: 'Spent one hour troubleshooting unexpected build errors.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.task.status).toBe(TaskStatus.FAILED);
    expect(res.body.data.outcome.reasonCategory).toBe(ReasonCategory.DISTRACTION);
    expect(res.body.data.outcome.actualReason).toBe('Spent one hour troubleshooting unexpected build errors.');
  });

  it('GET /api/v1/planner/day returns 24-hour timeline and metrics', async () => {
    const res = await request(app)
      .get('/api/v1/planner/day?date=2026-11-01')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.totalScheduled).toBe(1);
    expect(res.body.data.metrics.failedCount).toBe(1);
    expect(res.body.data.scheduled.fixed.length).toBe(1);
  });

  it('GET /api/v1/planner/overlaps identifies conflicting time ranges', async () => {
    const res = await request(app)
      .get('/api/v1/planner/overlaps?startAt=2026-11-01T10:00:00.000Z&endAt=2026-11-01T12:00:00.000Z')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.hasOverlap).toBe(true);
    expect(res.body.data.conflicts.length).toBe(1);
  });

  it('POST /api/v1/routines creates and applies a routine template', async () => {
    // 1. Create template
    const templateRes = await request(app)
      .post('/api/v1/routines')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Morning Routine',
        description: 'Consistent morning ritual'
      });

    expect(templateRes.status).toBe(201);
    const routineId = templateRes.body.data._id;

    // 2. Add item
    const itemRes = await request(app)
      .post(`/api/v1/routines/${routineId}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Morning Exercise',
        taskType: TaskType.FIXED,
        startTimeLocal: '07:00',
        endTimeLocal: '08:00',
        durationMinutes: 60
      });

    expect(itemRes.status).toBe(201);

    // 3. Apply to a new date
    const applyRes = await request(app)
      .post(`/api/v1/routines/${routineId}/apply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        startDate: '2026-11-05',
        endDate: '2026-11-05',
        conflictStrategy: 'SKIP'
      });

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.data.appliedCount).toBe(1);
  });
});

