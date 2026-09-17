/**
 * Life Dashboard — Local Lambda Simulation Server
 * Runs a standalone HTTP API Gateway simulator on port 3001
 * Dispatches to Lambda handlers, with graceful in-memory fallback when offline.
 */

import http from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Import Lambda Handlers
import { handler as billsCreate } from '../src/bills/create.js';
import { handler as billsList } from '../src/bills/list.js';
import { handler as billsUpdate } from '../src/bills/update.js';
import { handler as billsDelete } from '../src/bills/delete.js';

import { handler as tasksCreate } from '../src/tasks/create.js';
import { handler as tasksList } from '../src/tasks/list.js';
import { handler as tasksUpdate } from '../src/tasks/update.js';
import { handler as tasksDelete } from '../src/tasks/delete.js';

import { handler as calendarCreate } from '../src/calendar/create.js';
import { handler as calendarList } from '../src/calendar/list.js';
import { handler as calendarDelete } from '../src/calendar/delete.js';

import { handler as healthCreate } from '../src/health/create.js';
import { handler as healthList } from '../src/health/list.js';
import { handler as healthDelete } from '../src/health/delete.js';

import { handler as docsUpload } from '../src/documents/upload.js';
import { handler as docsList } from '../src/documents/list.js';
import { handler as docsDelete } from '../src/documents/delete.js';

import { handler as spendingCreate } from '../src/spending/create.js';
import { handler as spendingList } from '../src/spending/list.js';
import { handler as spendingSummary } from '../src/spending/summary.js';

import { handler as briefingGenerate } from '../src/briefing/generate.js';

const PORT = process.env.PORT || 3001;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

// In-Memory Storage for Standalone Local Development
const memoryDB = {
  bills: [],
  tasks: [],
  calendar: [],
  health: [],
  docs: [],
  spending: [],
  briefing: new Map(),
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  let bodyStr = '';
  for await (const chunk of req) {
    bodyStr += chunk;
  }

  const queryParams = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    queryParams[key] = value;
  }

  const userId = req.headers['x-user-id'] || 'demo-user-1';

  const baseEvent = {
    httpMethod: method,
    path: pathname,
    queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null,
    headers: req.headers,
    requestContext: {
      authorizer: {
        claims: {
          sub: userId,
          email: `${userId}@example.com`,
          name: 'Akshat Mohanty',
        },
      },
    },
    body: bodyStr || null,
  };

  let lambdaResponse = null;

  try {
    // 1. BILLS
    if (pathname === '/bills' && method === 'POST') {
      lambdaResponse = await billsCreate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        // In-memory fallback
        const body = JSON.parse(bodyStr || '{}');
        const item = {
          id: uuidv4(),
          userId,
          name: body.name,
          amount: Number(body.amount),
          dueDate: body.dueDate,
          isPaid: Boolean(body.isPaid),
          isRecurring: Boolean(body.isRecurring),
          frequency: body.frequency || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: body.isPaid ? 'paid' : 'upcoming',
        };
        memoryDB.bills.push(item);
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/bills' && method === 'GET') {
      lambdaResponse = await billsList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userBills = memoryDB.bills.filter((b) => b.userId === userId);
        const totalUnpaidAmount = userBills
          .filter((b) => !b.isPaid)
          .reduce((sum, b) => sum + (b.amount || 0), 0);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userBills,
            summary: { totalUnpaidAmount, unpaidCount: userBills.filter((b) => !b.isPaid).length, totalCount: userBills.length },
          }),
        };
      }
    } else if (pathname.startsWith('/bills/') && method === 'PUT') {
      const id = pathname.replace('/bills/', '');
      lambdaResponse = await billsUpdate({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const bill = memoryDB.bills.find((b) => b.id === id);
        if (bill) {
          Object.assign(bill, body, { updatedAt: new Date().toISOString() });
          lambdaResponse = { statusCode: 200, body: JSON.stringify({ item: bill }) };
        }
      }
    }

    // 2. TASKS
    else if (pathname === '/tasks' && method === 'POST') {
      lambdaResponse = await tasksCreate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const item = {
          id: uuidv4(),
          userId,
          title: body.title,
          description: body.description || '',
          dueDate: body.dueDate || null,
          priority: body.priority || 'medium',
          isCompleted: false,
          aiRank: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memoryDB.tasks.push(item);
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/tasks' && method === 'GET') {
      lambdaResponse = await tasksList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userTasks = memoryDB.tasks.filter((t) => t.userId === userId);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userTasks,
            summary: { totalCount: userTasks.length, completedCount: userTasks.filter((t) => t.isCompleted).length, pendingCount: userTasks.filter((t) => !t.isCompleted).length },
          }),
        };
      }
    } else if (pathname.startsWith('/tasks/') && method === 'PUT') {
      const id = pathname.replace('/tasks/', '');
      lambdaResponse = await tasksUpdate({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const task = memoryDB.tasks.find((t) => t.id === id);
        if (task) {
          Object.assign(task, body, { updatedAt: new Date().toISOString() });
          lambdaResponse = { statusCode: 200, body: JSON.stringify({ item: task }) };
        }
      }
    }

    // 3. CALENDAR
    else if (pathname === '/calendar' && method === 'POST') {
      lambdaResponse = await calendarCreate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const item = {
          id: uuidv4(),
          userId,
          title: body.title,
          date: body.date,
          time: body.time || null,
          location: body.location || null,
          notes: body.notes || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memoryDB.calendar.push(item);
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/calendar' && method === 'GET') {
      lambdaResponse = await calendarList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userEvents = memoryDB.calendar.filter((e) => e.userId === userId);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userEvents,
            summary: { todayCount: userEvents.length, next7DaysCount: userEvents.length, totalCount: userEvents.length },
          }),
        };
      }
    }

    // 4. HEALTH
    else if (pathname === '/health' && method === 'POST') {
      lambdaResponse = await healthCreate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const item = {
          id: uuidv4(),
          userId,
          name: body.name,
          frequency: body.frequency || 'daily',
          time: body.time,
          phoneNumber: body.phoneNumber || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        memoryDB.health.push(item);
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/health' && method === 'GET') {
      lambdaResponse = await healthList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userReminders = memoryDB.health.filter((h) => h.userId === userId);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userReminders,
            summary: { totalCount: userReminders.length, dailyCount: userReminders.length, weeklyCount: 0, smsAlertsEnabledCount: 0 },
          }),
        };
      }
    }

    // 5. DOCUMENTS
    else if (pathname === '/documents/upload' && method === 'POST') {
      lambdaResponse = await docsUpload(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const id = uuidv4();
        const item = {
          id,
          userId,
          name: body.name,
          s3Key: `documents/${userId}/${id}-${body.fileName || 'file.pdf'}`,
          category: body.category || 'other',
          expiryDate: body.expiryDate || null,
          createdAt: new Date().toISOString(),
        };
        memoryDB.docs.push(item);
        lambdaResponse = {
          statusCode: 201,
          body: JSON.stringify({
            item,
            uploadUrl: `http://localhost:${PORT}/mock-s3-upload`,
            s3Key: item.s3Key,
          }),
        };
      }
    } else if (pathname === '/documents' && method === 'GET') {
      lambdaResponse = await docsList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userDocs = memoryDB.docs.filter((d) => d.userId === userId);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userDocs,
            summary: { totalCount: userDocs.length, expiringSoonCount: 0, expiredCount: 0 },
          }),
        };
      }
    }

    // 6. SPENDING
    else if (pathname === '/spending' && method === 'POST') {
      lambdaResponse = await spendingCreate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const item = {
          id: uuidv4(),
          userId,
          amount: Number(body.amount),
          category: body.category,
          description: body.description,
          date: body.date || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };
        memoryDB.spending.push(item);
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/spending/summary' && method === 'GET') {
      lambdaResponse = await spendingSummary(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const userSpend = memoryDB.spending.filter((s) => s.userId === userId);
        const total = userSpend.reduce((sum, s) => sum + (s.amount || 0), 0);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            summary: {
              currentMonthTotal: total,
              lastMonthTotal: 0,
              monthOverMonthPctChange: 0,
              softMonthlyBudget: 50000,
              budgetRemaining: 50000 - total,
              budgetConsumedPercentage: Math.round((total / 50000) * 100),
              byCategory: [{ category: 'food', amount: total, percentage: 100, count: 1 }],
              availableMonths: [new Date().toISOString().slice(0, 7)],
            },
          }),
        };
      }
    }

    // 7. BRIEFING
    else if (pathname === '/briefing/today' && method === 'GET') {
      lambdaResponse = await briefingGenerate(baseEvent);
    } else if (pathname === '/briefing/generate' && method === 'POST') {
      lambdaResponse = await briefingGenerate(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        const todayStr = new Date().toISOString().split('T')[0];
        const content = `Good morning Akshat! Today is Thursday, ${todayStr}.

🔴 Needs attention today:
- Check your urgent items and morning schedule.
- Ensure pending deadlines are tracked.

🟡 Coming up soon:
- Review utility renewals and upcoming appointments.

✅ You're on top of:
- Your daily hydration and task list are organized.

Stay focused and take things one step at a time!`;
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            item: {
              userId,
              date: todayStr,
              content,
              generatedAt: new Date().toISOString(),
            },
          }),
        };
      }
    } else {
      lambdaResponse = {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: { message: `Route ${method} ${pathname} not found` } }),
      };
    }
  } catch (err) {
    lambdaResponse = {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }

  const responseHeaders = {
    ...CORS_HEADERS,
    ...(lambdaResponse?.headers || {}),
  };

  res.writeHead(lambdaResponse?.statusCode || 500, responseHeaders);
  res.end(lambdaResponse?.body || '');
});

server.listen(PORT, () => {
  console.log(`🚀 Life Dashboard Local API Gateway running on port ${PORT}`);
});
