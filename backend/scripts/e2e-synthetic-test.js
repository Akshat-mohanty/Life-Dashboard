/**
 * Meridian — End-to-End Synthetic User Lifecycle Test
 * Validates the entire user flow across all 7 modules against live API Gateway or local test server.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const BASE_URL = process.env.API_ENDPOINT || 'http://localhost:3001';
const TEST_USER_ID = process.env.TEST_USER_ID || `e2e-user-${Date.now()}`;
const TEST_TOKEN = process.env.AUTH_TOKEN || `mock-token-${TEST_USER_ID}`;

console.log('========================================================');
console.log(' Meridian — End-to-End Synthetic Test Runner');
console.log(` Target Endpoint: ${BASE_URL}`);
console.log(` Test User ID:    ${TEST_USER_ID}`);
console.log('========================================================\n');

// HTTP request helper
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(path, BASE_URL);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const payload = data ? JSON.stringify(data) : null;
    const options = {
      method,
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_TOKEN}`,
        'x-user-id': TEST_USER_ID,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 15000,
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, rawBody: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after 15000ms: ${method} ${path}`));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runE2ETests() {
  let passed = 0;
  let failed = 0;

  const assertStep = (description, condition, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
      failed++;
    }
  };

  try {
    // 1. BILLS MODULE
    console.log('\n[1/7] Testing Bills & Payments Module...');
    const createBillRes = await makeRequest('POST', '/bills', {
      name: 'E2E Cloud Subscription',
      amount: 1499,
      dueDate: new Date().toISOString().split('T')[0],
      isRecurring: true,
      frequency: 'monthly',
      isPaid: false,
    });
    assertStep('Create new bill', createBillRes.statusCode === 201, `Status: ${createBillRes.statusCode}`);
    const billId = createBillRes.data?.item?.id;

    const listBillsRes = await makeRequest('GET', '/bills');
    assertStep('List bills', listBillsRes.statusCode === 200);

    if (billId) {
      const updateBillRes = await makeRequest('PUT', `/bills/${billId}`, { isPaid: true });
      assertStep('Mark bill as paid', updateBillRes.statusCode === 200 && updateBillRes.data?.item?.isPaid === true);
    }

    // 2. TASKS MODULE
    console.log('\n[2/7] Testing Tasks Module...');
    const createTaskRes = await makeRequest('POST', '/tasks', {
      title: 'E2E Architecture Certification',
      description: 'Prepare documentation & slides',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
    });
    assertStep('Create urgent task', createTaskRes.statusCode === 201);
    const taskId = createTaskRes.data?.item?.id;

    const listTasksRes = await makeRequest('GET', '/tasks');
    assertStep('List tasks with AI ranking', listTasksRes.statusCode === 200 && Array.isArray(listTasksRes.data?.items));

    if (taskId) {
      const updateTaskRes = await makeRequest('PUT', `/tasks/${taskId}`, { isCompleted: true });
      assertStep('Complete task', updateTaskRes.statusCode === 200 && updateTaskRes.data?.item?.isCompleted === true);
    }

    // 3. CALENDAR MODULE
    console.log('\n[3/7] Testing Calendar Module...');
    const createCalRes = await makeRequest('POST', '/calendar', {
      title: 'E2E AWS Review Sync',
      date: new Date().toISOString().split('T')[0],
      time: '14:00',
      location: 'AWS Meet',
      notes: 'Solutions architecture sign-off',
    });
    assertStep('Create calendar event', createCalRes.statusCode === 201);

    const listCalRes = await makeRequest('GET', '/calendar');
    assertStep('List events for next 7 days', listCalRes.statusCode === 200 && listCalRes.data?.summary?.next7DaysCount >= 1);

    // 4. HEALTH REMINDERS MODULE
    console.log('\n[4/7] Testing Health Reminders Module...');
    const createHealthRes = await makeRequest('POST', '/health', {
      name: 'Take Vitamin C & Zinc',
      frequency: 'daily',
      time: '09:00',
      phoneNumber: '+15551234567',
    });
    assertStep('Create health reminder with SNS SMS trigger', createHealthRes.statusCode === 201);

    const listHealthRes = await makeRequest('GET', '/health');
    assertStep('List health reminders', listHealthRes.statusCode === 200);

    // 5. DOCUMENTS MODULE
    console.log('\n[5/7] Testing Documents Module...');
    const uploadDocRes = await makeRequest('POST', '/documents/upload', {
      name: 'Passport National Copy',
      category: 'ID',
      expiryDate: '2030-01-01',
      fileType: 'application/pdf',
    });
    assertStep(
      'Acquire presigned S3 PUT URL for document',
      uploadDocRes.statusCode === 201 && uploadDocRes.data?.uploadUrl && uploadDocRes.data?.s3Key
    );

    const listDocsRes = await makeRequest('GET', '/documents');
    assertStep('List documents with presigned download links', listDocsRes.statusCode === 200);

    // 6. SPENDING MODULE
    console.log('\n[6/7] Testing Spending & Budget Module...');
    const createSpendRes = await makeRequest('POST', '/spending', {
      amount: 1850,
      category: 'food',
      description: 'E2E Team Lunch Celebration',
    });
    assertStep('Log spending record', createSpendRes.statusCode === 201);

    const summarySpendRes = await makeRequest('GET', '/spending/summary');
    assertStep(
      'Compute spending summary & donut chart category breakdown',
      summarySpendRes.statusCode === 200 && Array.isArray(summarySpendRes.data?.summary?.byCategory)
    );

    // 7. BEDROCK AI MORNING BRIEFING
    console.log('\n[7/7] Testing AI Morning Briefing Module...');
    const briefingTodayRes = await makeRequest('GET', '/briefing/today');
    assertStep('Check today briefing endpoint', briefingTodayRes.statusCode === 200);

    const generateBriefingRes = await makeRequest('POST', '/briefing/generate');
    assertStep(
      'Trigger Bedrock Claude morning briefing generation',
      generateBriefingRes.statusCode === 200 && generateBriefingRes.data?.item?.content
    );

    if (generateBriefingRes.data?.item?.content) {
      console.log('\n--- Sample Generated AI Briefing Output ---');
      console.log(generateBriefingRes.data.item.content);
      console.log('-------------------------------------------\n');
    }

    console.log('========================================================');
    console.log(` E2E Test Run Complete: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Fatal E2E Test Exception:', err.message);
    process.exit(1);
  }
}

runE2ETests();
