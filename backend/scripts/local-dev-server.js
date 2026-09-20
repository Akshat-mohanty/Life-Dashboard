/**
 * Meridian — Local Lambda Simulation Server
 * Runs a standalone HTTP API Gateway simulator on port 3001
 * Dispatches to Lambda handlers, with graceful in-memory fallback when offline.
 */

import http from 'http';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../data/local-memory-db.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        bills: raw.bills || [],
        tasks: raw.tasks || [],
        calendar: raw.calendar || [],
        health: raw.health || [],
        docs: raw.docs || [],
        spending: raw.spending || [],
        briefing: new Map(raw.briefing || []),
        profiles: new Map(raw.profiles || []),
      };
    }
  } catch (e) {
    console.warn('Could not read DB_FILE, starting with empty state:', e.message);
  }
  return {
    bills: [],
    tasks: [],
    calendar: [],
    health: [],
    docs: [],
    spending: [],
    briefing: new Map(),
    profiles: new Map(),
  };
}

const memoryDB = loadDB();

function saveDB() {
  try {
    const serialized = {
      bills: memoryDB.bills,
      tasks: memoryDB.tasks,
      calendar: memoryDB.calendar,
      health: memoryDB.health,
      docs: memoryDB.docs,
      spending: memoryDB.spending,
      briefing: Array.from(memoryDB.briefing.entries()),
      profiles: Array.from(memoryDB.profiles.entries()),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(serialized, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save DB_FILE:', e.message);
  }
}

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
import { handler as userGet } from '../src/user/get.js';
import { handler as userUpdate } from '../src/user/update.js';

const PORT = process.env.PORT || 3001;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-user-id',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
        saveDB();
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
        const bill = memoryDB.bills.find((b) => b.id === id && b.userId === userId);
        if (bill) {
          Object.assign(bill, body, { updatedAt: new Date().toISOString() });
          saveDB();
          lambdaResponse = { statusCode: 200, body: JSON.stringify({ item: bill }) };
        }
      }
    } else if (pathname.startsWith('/bills/') && method === 'DELETE') {
      const id = pathname.replace('/bills/', '');
      lambdaResponse = await billsDelete({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        memoryDB.bills = memoryDB.bills.filter((b) => !(b.id === id && b.userId === userId));
        saveDB();
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Bill deleted' }) };
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
        saveDB();
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/tasks' && method === 'GET') {
      lambdaResponse = await tasksList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        let userTasks = memoryDB.tasks.filter((t) => t.userId === userId);
        if (queryParams.date) {
          userTasks = userTasks.filter((t) => t.dueDate === queryParams.date || t.createdAt?.startsWith(queryParams.date));
        }
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
        const task = memoryDB.tasks.find((t) => t.id === id && t.userId === userId);
        if (task) {
          Object.assign(task, body, { updatedAt: new Date().toISOString() });
          saveDB();
          lambdaResponse = { statusCode: 200, body: JSON.stringify({ item: task }) };
        }
      }
    } else if (pathname.startsWith('/tasks/') && method === 'DELETE') {
      const id = pathname.replace('/tasks/', '');
      lambdaResponse = await tasksDelete({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        memoryDB.tasks = memoryDB.tasks.filter((t) => !(t.id === id && t.userId === userId));
        saveDB();
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Task deleted' }) };
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
        saveDB();
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/calendar' && method === 'GET') {
      lambdaResponse = await calendarList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        let userEvents = memoryDB.calendar.filter((e) => e.userId === userId);
        if (queryParams.date) {
          userEvents = userEvents.filter((e) => e.date === queryParams.date);
        }
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            items: userEvents,
            summary: { todayCount: userEvents.length, next7DaysCount: userEvents.length, totalCount: userEvents.length },
          }),
        };
      }
    } else if (pathname.startsWith('/calendar/') && method === 'DELETE') {
      const id = pathname.replace('/calendar/', '');
      lambdaResponse = await calendarDelete({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        memoryDB.calendar = memoryDB.calendar.filter((c) => !(c.id === id && c.userId === userId));
        saveDB();
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Calendar event deleted' }) };
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
        saveDB();
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
    } else if (pathname.startsWith('/health/') && method === 'DELETE') {
      const id = pathname.replace('/health/', '');
      lambdaResponse = await healthDelete({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        memoryDB.health = memoryDB.health.filter((h) => !(h.id === id && h.userId === userId));
        saveDB();
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Health reminder deleted' }) };
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
        saveDB();
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
    } else if (pathname.startsWith('/documents/') && method === 'DELETE') {
      const id = pathname.replace('/documents/', '');
      lambdaResponse = await docsDelete({ ...baseEvent, pathParameters: { id } });
      if (lambdaResponse.statusCode >= 500) {
        memoryDB.docs = memoryDB.docs.filter((d) => !(d.id === id && d.userId === userId));
        saveDB();
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Document deleted' }) };
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
        saveDB();
        lambdaResponse = { statusCode: 201, body: JSON.stringify({ item }) };
      }
    } else if (pathname === '/spending' && method === 'GET') {
      lambdaResponse = await spendingList(baseEvent);
      if (lambdaResponse.statusCode >= 500) {
        let userSpend = memoryDB.spending.filter((s) => s.userId === userId);
        if (queryParams.date) {
          userSpend = userSpend.filter((s) => s.date === queryParams.date);
        } else if (queryParams.month) {
          userSpend = userSpend.filter((s) => s.date?.startsWith(queryParams.month));
        }
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ items: userSpend }) };
      }
    } else if (pathname.startsWith('/spending/') && method === 'DELETE') {
      const id = pathname.replace('/spending/', '');
      memoryDB.spending = memoryDB.spending.filter((s) => !(s.id === id && s.userId === userId));
      saveDB();
      lambdaResponse = { statusCode: 200, body: JSON.stringify({ message: 'Expense deleted' }) };
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

    // 7. DAILY HISTORICAL ARCHIVE (Strictly Isolated to userId)
    else if (pathname === '/archive/daily' && method === 'GET') {
      const targetDate = queryParams.date || new Date().toISOString().split('T')[0];
      const briefingKey = `${userId}#${targetDate}`;
      let briefingItem = memoryDB.briefing.get(briefingKey) || null;

      // Purge any legacy mock briefings
      if (
        briefingItem &&
        (briefingItem.content?.includes('Completed task reviews and scheduled agenda items') ||
          briefingItem.content?.includes('Personal workspace and health goals logged'))
      ) {
        memoryDB.briefing.delete(briefingKey);
        saveDB();
        briefingItem = null;
      }

      const userTasks = memoryDB.tasks.filter(
        (t) => t.userId === userId && (t.dueDate === targetDate || t.createdAt?.startsWith(targetDate))
      );
      const userCalendar = memoryDB.calendar.filter(
        (c) => c.userId === userId && c.date === targetDate
      );
      const userSpending = memoryDB.spending.filter(
        (s) => s.userId === userId && s.date === targetDate
      );
      const userBills = memoryDB.bills.filter(
        (b) => b.userId === userId && (b.dueDate === targetDate || b.createdAt?.startsWith(targetDate))
      );
      const userDocs = memoryDB.docs.filter(
        (d) => d.userId === userId && d.createdAt?.startsWith(targetDate)
      );

      const dailySpendingTotal = userSpending.reduce((sum, s) => sum + (s.amount || 0), 0);

      lambdaResponse = {
        statusCode: 200,
        body: JSON.stringify({
          userId,
          date: targetDate,
          briefing: briefingItem,
          tasks: userTasks,
          calendar: userCalendar,
          spending: userSpending,
          spendingTotal: dailySpendingTotal,
          bills: userBills,
          documents: userDocs,
        }),
      };
    }

    // 8. BRIEFING
    else if ((pathname === '/briefing/today' || pathname === '/briefing') && method === 'GET') {
      const targetDate = queryParams.date || new Date().toISOString().split('T')[0];
      const briefingKey = `${userId}#${targetDate}`;
      let stored = memoryDB.briefing.get(briefingKey);

      // Purge any legacy mock briefings
      if (
        stored &&
        (stored.content?.includes('Completed task reviews and scheduled agenda items') ||
          stored.content?.includes('Personal workspace and health goals logged'))
      ) {
        memoryDB.briefing.delete(briefingKey);
        saveDB();
        stored = null;
      }

      if (stored) {
        lambdaResponse = { statusCode: 200, body: JSON.stringify({ item: stored, exists: true }) };
      } else {
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({ item: null, exists: false, message: 'No briefing generated yet.' }),
        };
      }
    } else if ((pathname === '/briefing' || pathname === '/briefing/today') && method === 'DELETE') {
      const targetDate = queryParams.date || new Date().toISOString().split('T')[0];
      const briefingKey = `${userId}#${targetDate}`;
      memoryDB.briefing.delete(briefingKey);
      saveDB();
      lambdaResponse = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Briefing deleted successfully', exists: false, item: null }),
      };
    } else if (pathname === '/briefing/generate' && method === 'POST') {
      const body = JSON.parse(bodyStr || '{}');
      const targetDate = body.date || new Date().toISOString().split('T')[0];
      const briefingKey = `${userId}#${targetDate}`;

      const userTasks = memoryDB.tasks.filter((t) => t.userId === userId);
      const userBills = memoryDB.bills.filter((b) => b.userId === userId);
      const userCalendar = memoryDB.calendar.filter((c) => c.userId === userId);
      const userSpending = memoryDB.spending.filter((s) => s.userId === userId);
      const userDocs = memoryDB.docs.filter((d) => d.userId === userId);
      const userHealth = memoryDB.health.filter((h) => h.userId === userId);
      const hasUserData =
        userTasks.length > 0 ||
        userBills.length > 0 ||
        userCalendar.length > 0 ||
        userSpending.length > 0 ||
        userDocs.length > 0 ||
        userHealth.length > 0;

      if (!hasUserData) {
        const item = {
          userId,
          date: targetDate,
          content: 'No value is entered.',
          generatedAt: new Date().toISOString(),
        };
        memoryDB.briefing.set(briefingKey, item);
        saveDB();
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({ item }),
        };
      } else {
        lambdaResponse = await briefingGenerate(baseEvent);
        if (lambdaResponse.statusCode >= 500) {
          const parts = [];
          if (userTasks.length) parts.push(`• Tasks: ${userTasks.map((t) => t.title).slice(0, 3).join(', ')}`);
          if (userBills.length) parts.push(`• Bills: ${userBills.map((b) => `${b.name} (₹${b.amount})`).slice(0, 3).join(', ')}`);
          if (userCalendar.length) parts.push(`• Schedule: ${userCalendar.map((c) => `${c.title} (${c.time || 'all day'})`).slice(0, 3).join(', ')}`);
          if (userSpending.length) parts.push(`• Spending: ₹${userSpending.reduce((sum, s) => sum + (s.amount || 0), 0)} logged`);

          const content = `Executive Briefing for ${targetDate}:\n\n${parts.join('\n\n')}`;
          const item = {
            userId,
            date: targetDate,
            content,
            generatedAt: new Date().toISOString(),
          };
          memoryDB.briefing.set(briefingKey, item);
          saveDB();
          lambdaResponse = {
            statusCode: 200,
            body: JSON.stringify({ item }),
          };
        } else {
          try {
            const parsed = JSON.parse(lambdaResponse.body);
            if (parsed?.item) {
              memoryDB.briefing.set(briefingKey, parsed.item);
              saveDB();
            }
          } catch {}
        }
      }
    } else if (pathname === '/user/profile' && method === 'GET') {
      lambdaResponse = await userGet(baseEvent);
      if (!lambdaResponse || lambdaResponse.statusCode >= 500) {
        const profile = memoryDB.profiles.get(userId) || {
          userId,
          name: userId === 'demo-user-1' ? 'Akshat Mohanty' : (userId ? userId.split('@')[0] : 'User'),
          email: `${userId}@example.com`,
          avatarUrl: '',
          defaultCurrency: 'INR',
        };
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({ profile }),
        };
      }
    } else if (pathname === '/user/profile' && method === 'PUT') {
      lambdaResponse = await userUpdate(baseEvent);
      if (!lambdaResponse || lambdaResponse.statusCode >= 500) {
        const body = JSON.parse(bodyStr || '{}');
        const existing = memoryDB.profiles.get(userId) || {
          userId,
          name: userId === 'demo-user-1' ? 'Akshat Mohanty' : (userId ? userId.split('@')[0] : 'User'),
          email: `${userId}@example.com`,
          avatarUrl: '',
          defaultCurrency: 'INR',
        };
        const updated = {
          ...existing,
          ...(body.name !== undefined && { name: body.name.trim() }),
          ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
          ...(body.defaultCurrency !== undefined && { defaultCurrency: body.defaultCurrency }),
          updatedAt: new Date().toISOString(),
        };
        memoryDB.profiles.set(userId, updated);
        lambdaResponse = {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Profile updated in database.',
            profile: updated,
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
  console.log(`🚀 Meridian Local API Gateway running on port ${PORT}`);
});
