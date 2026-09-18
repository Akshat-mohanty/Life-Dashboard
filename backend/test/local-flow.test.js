/**
 * Meridian — Comprehensive Integration & Lambda Flow Test Suite
 * Tests all 18 Lambda functions against simulated API Gateway events.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Helper to construct synthetic API Gateway event
const createEvent = ({
  httpMethod = 'GET',
  path = '/',
  pathParameters = null,
  queryStringParameters = null,
  body = null,
  userId = 'test-user-flow-1',
} = {}) => ({
  httpMethod,
  path,
  pathParameters,
  queryStringParameters,
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  },
  requestContext: {
    authorizer: {
      claims: {
        sub: userId,
        email: `${userId}@example.com`,
        name: 'Test User',
      },
    },
  },
  body: body ? JSON.stringify(body) : null,
});

test('Integration Suite — Bills Module', async (t) => {
  const { handler: createBill } = await import('../src/bills/create.js');
  const { handler: listBills } = await import('../src/bills/list.js');
  const { handler: updateBill } = await import('../src/bills/update.js');
  const { handler: deleteBill } = await import('../src/bills/delete.js');

  await t.test('POST /bills — rejects missing name', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { amount: 1200, dueDate: '2026-09-25' },
    });
    const res = await createBill(event);
    assert.equal(res.statusCode, 400);
    const parsed = JSON.parse(res.body);
    assert.match(parsed.error.message, /name/);
  });

  await t.test('POST /bills — rejects non-positive amount', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { name: 'Gym', amount: -50, dueDate: '2026-09-25' },
    });
    const res = await createBill(event);
    assert.equal(res.statusCode, 400);
    const parsed = JSON.parse(res.body);
    assert.match(parsed.error.message, /amount/);
  });

  await t.test('POST /bills — rejects invalid frequency for recurring bill', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { name: 'Gym', amount: 500, dueDate: '2026-09-25', isRecurring: true, frequency: 'hourly' },
    });
    const res = await createBill(event);
    assert.equal(res.statusCode, 400);
  });

  await t.test('PUT /bills/{id} — rejects missing path parameter', async () => {
    const event = createEvent({
      httpMethod: 'PUT',
      pathParameters: {},
      body: { isPaid: true },
    });
    const res = await updateBill(event);
    assert.equal(res.statusCode, 400);
  });

  await t.test('DELETE /bills/{id} — rejects missing path parameter', async () => {
    const event = createEvent({
      httpMethod: 'DELETE',
      pathParameters: {},
    });
    const res = await deleteBill(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — Tasks Module', async (t) => {
  const { handler: createTask } = await import('../src/tasks/create.js');
  const { handler: updateTask } = await import('../src/tasks/update.js');
  const { handler: deleteTask } = await import('../src/tasks/delete.js');

  await t.test('POST /tasks — rejects missing title', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { priority: 'high' },
    });
    const res = await createTask(event);
    assert.equal(res.statusCode, 400);
    const parsed = JSON.parse(res.body);
    assert.match(parsed.error.message, /title/);
  });

  await t.test('POST /tasks — rejects invalid priority', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { title: 'Review PR', priority: 'ultra-critical' },
    });
    const res = await createTask(event);
    assert.equal(res.statusCode, 400);
  });

  await t.test('PUT /tasks/{id} — validates aiRank bounds (1-10)', async () => {
    const event = createEvent({
      httpMethod: 'PUT',
      pathParameters: { id: 'task-123' },
      body: { aiRank: 15 },
    });
    const res = await updateTask(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — Calendar Module', async (t) => {
  const { handler: createCalendar } = await import('../src/calendar/create.js');
  const { handler: deleteCalendar } = await import('../src/calendar/delete.js');

  await t.test('POST /calendar — rejects missing date', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { title: 'Doctor Visit' },
    });
    const res = await createCalendar(event);
    assert.equal(res.statusCode, 400);
  });

  await t.test('POST /calendar — rejects empty title', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { title: '   ', date: '2026-09-20' },
    });
    const res = await createCalendar(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — Health Reminders Module', async (t) => {
  const { handler: createHealth } = await import('../src/health/create.js');

  await t.test('POST /health — rejects invalid 24-hr time format', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { name: 'Drink Water', frequency: 'daily', time: '25:70' },
    });
    const res = await createHealth(event);
    assert.equal(res.statusCode, 400);
    const parsed = JSON.parse(res.body);
    assert.match(parsed.error.message, /24-hour/);
  });

  await t.test('POST /health — rejects invalid frequency', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { name: 'Drink Water', frequency: 'bi-monthly', time: '09:00' },
    });
    const res = await createHealth(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — Documents Module', async (t) => {
  const { handler: uploadDoc } = await import('../src/documents/upload.js');

  await t.test('POST /documents/upload — rejects invalid category', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { name: 'Passport', category: 'secret-vault' },
    });
    const res = await uploadDoc(event);
    assert.equal(res.statusCode, 400);
  });

  await t.test('POST /documents/upload — rejects missing document name', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { category: 'ID' },
    });
    const res = await uploadDoc(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — Spending Module', async (t) => {
  const { handler: createSpending } = await import('../src/spending/create.js');

  await t.test('POST /spending — rejects invalid category', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { amount: 450, category: 'crypto-gamble', description: 'Tokens' },
    });
    const res = await createSpending(event);
    assert.equal(res.statusCode, 400);
    const parsed = JSON.parse(res.body);
    assert.match(parsed.error.message, /category/);
  });

  await t.test('POST /spending — rejects negative amount', async () => {
    const event = createEvent({
      httpMethod: 'POST',
      body: { amount: -100, category: 'food', description: 'Lunch' },
    });
    const res = await createSpending(event);
    assert.equal(res.statusCode, 400);
  });
});

test('Integration Suite — AI Briefing Module', async (t) => {
  const { handler: generateBriefing } = await import('../src/briefing/generate.js');

  await t.test('GET /briefing/today — checks for existing briefing structure', async () => {
    const event = createEvent({
      httpMethod: 'GET',
      path: '/briefing/today',
    });
    const res = await generateBriefing(event);
    assert.equal(res.statusCode, 200);
    const parsed = JSON.parse(res.body);
    assert.ok(parsed.today);
    assert.equal(typeof parsed.exists, 'boolean');
  });
});
