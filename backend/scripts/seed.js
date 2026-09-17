/**
 * Life Dashboard - DynamoDB Seed Script
 * Seeds comprehensive mock data for local testing and initial environment setup.
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || 'LifeDashboard';
const REGION = process.env.AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : undefined);
const TEST_USER_ID = process.env.TEST_USER_ID || 'demo-user-1';
const USER_NAME = process.env.TEST_USER_NAME || 'Akshat';

const clientConfig = {
  region: REGION,
};

if (ENDPOINT) {
  clientConfig.endpoint = ENDPOINT;
  clientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };
}

const rawClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(rawClient);

// Helper to format ISO dates relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const getIsoTimestamp = (offsetDays = 0, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const todayDate = getRelativeDate(0);
const nowIso = new Date().toISOString();

async function ensureTableExists() {
  console.log(`Checking table "${TABLE_NAME}"...`);
  try {
    await rawClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists.`);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`Table "${TABLE_NAME}" not found. Creating table...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
        })
      );
      console.log(`Table "${TABLE_NAME}" created successfully.`);
    } else {
      console.warn(`Could not verify table existence: ${err.message}. Proceeding assuming it exists.`);
    }
  }
}

const seedData = [
  // ==========================================
  // BILLS
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'BILL#bill-101',
    userId: TEST_USER_ID,
    id: 'bill-101',
    name: 'Broadband Fiber Internet',
    amount: 1199,
    dueDate: getRelativeDate(-2), // Overdue
    isPaid: false,
    isRecurring: true,
    frequency: 'monthly',
    createdAt: getIsoTimestamp(-30),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'BILL#bill-102',
    userId: TEST_USER_ID,
    id: 'bill-102',
    name: 'Electricity & Power Utility',
    amount: 2850,
    dueDate: getRelativeDate(2), // Due within 3 days
    isPaid: false,
    isRecurring: true,
    frequency: 'monthly',
    createdAt: getIsoTimestamp(-25),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'BILL#bill-103',
    userId: TEST_USER_ID,
    id: 'bill-103',
    name: 'Apartment Maintenance',
    amount: 4500,
    dueDate: getRelativeDate(10), // Upcoming
    isPaid: false,
    isRecurring: true,
    frequency: 'monthly',
    createdAt: getIsoTimestamp(-15),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'BILL#bill-104',
    userId: TEST_USER_ID,
    id: 'bill-104',
    name: 'Annual Health Insurance Premium',
    amount: 14500,
    dueDate: getRelativeDate(-5),
    isPaid: true, // Paid
    isRecurring: true,
    frequency: 'yearly',
    createdAt: getIsoTimestamp(-40),
    updatedAt: nowIso,
  },

  // ==========================================
  // TASKS
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'TASK#task-201',
    userId: TEST_USER_ID,
    id: 'task-201',
    title: 'Submit Q3 TDS and Tax Invoices',
    description: 'Compile vendor receipts and email summary to CA',
    dueDate: getRelativeDate(0), // Today
    priority: 'high',
    isCompleted: false,
    aiRank: 1,
    createdAt: getIsoTimestamp(-3),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'TASK#task-202',
    userId: TEST_USER_ID,
    id: 'task-202',
    title: 'Schedule Annual Car Servicing',
    description: '10,000 km periodic inspection and tire rotation',
    dueDate: getRelativeDate(1), // Tomorrow
    priority: 'medium',
    isCompleted: false,
    aiRank: 2,
    createdAt: getIsoTimestamp(-2),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'TASK#task-203',
    userId: TEST_USER_ID,
    id: 'task-203',
    title: 'Renew Passport Tatkaal Slot',
    description: 'Check PSK appointment availability for spouse',
    dueDate: getRelativeDate(3),
    priority: 'high',
    isCompleted: false,
    aiRank: 3,
    createdAt: getIsoTimestamp(-5),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'TASK#task-204',
    userId: TEST_USER_ID,
    id: 'task-204',
    title: 'Clean and Replace AC Dust Filters',
    description: 'Living room and study room split units',
    dueDate: getRelativeDate(6),
    priority: 'low',
    isCompleted: false,
    aiRank: 4,
    createdAt: getIsoTimestamp(-1),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'TASK#task-205',
    userId: TEST_USER_ID,
    id: 'task-205',
    title: 'Order Monthly Pet Supplies',
    description: 'Grain-free kibble and dental chews',
    dueDate: null,
    priority: 'low',
    isCompleted: true,
    aiRank: 7,
    createdAt: getIsoTimestamp(-10),
    updatedAt: nowIso,
  },

  // ==========================================
  // CALENDAR
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'EVENT#event-301',
    userId: TEST_USER_ID,
    id: 'event-301',
    title: 'Architecture Review with Cloud Team',
    date: getRelativeDate(0), // Today
    time: '11:00',
    location: 'Google Meet',
    notes: 'Go over DynamoDB Single Table access patterns and SAM deployment',
    createdAt: getIsoTimestamp(-4),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'EVENT#event-302',
    userId: TEST_USER_ID,
    id: 'event-302',
    title: 'Dentist Hygiene Appointment',
    date: getRelativeDate(1), // Tomorrow
    time: '16:00',
    location: 'Apollo Dental Clinic, Koramangala',
    notes: 'Arrive 10 minutes early for medical history update',
    createdAt: getIsoTimestamp(-7),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'EVENT#event-303',
    userId: TEST_USER_ID,
    id: 'event-303',
    title: 'Weekend Cyclothon 30K',
    date: getRelativeDate(3),
    time: '06:00',
    location: 'Cubbon Park Main Gate',
    notes: 'Hydration pack and helmet mandatory',
    createdAt: getIsoTimestamp(-2),
    updatedAt: nowIso,
  },

  // ==========================================
  // HEALTH REMINDERS
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'HEALTH#health-401',
    userId: TEST_USER_ID,
    id: 'health-401',
    name: 'Take Vitamin D3 (60K IU) & Omega-3',
    frequency: 'daily',
    time: '08:30',
    phoneNumber: '+919876543210',
    lastTriggered: getIsoTimestamp(-1, 8, 30),
    createdAt: getIsoTimestamp(-60),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'HEALTH#health-402',
    userId: TEST_USER_ID,
    id: 'health-402',
    name: 'Mid-day Hydration Break (750ml)',
    frequency: 'daily',
    time: '13:00',
    phoneNumber: null,
    lastTriggered: getIsoTimestamp(-1, 13, 0),
    createdAt: getIsoTimestamp(-30),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'HEALTH#health-403',
    userId: TEST_USER_ID,
    id: 'health-403',
    name: 'Post-work Ergonomic Stretches',
    frequency: 'daily',
    time: '19:00',
    phoneNumber: '+919876543210',
    lastTriggered: getIsoTimestamp(-1, 19, 0),
    createdAt: getIsoTimestamp(-20),
    updatedAt: nowIso,
  },

  // ==========================================
  // DOCUMENTS
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'DOC#doc-501',
    userId: TEST_USER_ID,
    id: 'doc-501',
    name: 'Family Floater Health Insurance Card',
    s3Key: `documents/${TEST_USER_ID}/health-insurance-policy.pdf`,
    fileType: 'application/pdf',
    expiryDate: getRelativeDate(18), // Expiring in 18 days (<= 30 days)
    category: 'insurance',
    createdAt: getIsoTimestamp(-90),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'DOC#doc-502',
    userId: TEST_USER_ID,
    id: 'doc-502',
    name: 'National Passport Scan',
    s3Key: `documents/${TEST_USER_ID}/passport-copy.pdf`,
    fileType: 'application/pdf',
    expiryDate: getRelativeDate(750),
    category: 'ID',
    createdAt: getIsoTimestamp(-120),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'DOC#doc-503',
    userId: TEST_USER_ID,
    id: 'doc-503',
    name: 'Four Wheeler Pollution Under Control (PUC)',
    s3Key: `documents/${TEST_USER_ID}/car-puc-certificate.pdf`,
    fileType: 'application/pdf',
    expiryDate: getRelativeDate(8), // Expiring in 8 days!
    category: 'certificate',
    createdAt: getIsoTimestamp(-170),
    updatedAt: nowIso,
  },

  // ==========================================
  // SPENDING (This Month & Last Month)
  // ==========================================
  // This month
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-601',
    userId: TEST_USER_ID,
    id: 'spend-601',
    amount: 1650,
    category: 'food',
    description: 'Organic groceries from Nature Basket',
    date: getRelativeDate(-1),
    createdAt: getIsoTimestamp(-1, 14, 20),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-602',
    userId: TEST_USER_ID,
    id: 'spend-602',
    amount: 820,
    category: 'transport',
    description: 'Uber cab to tech park and back',
    date: getRelativeDate(-2),
    createdAt: getIsoTimestamp(-2, 19, 10),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-603',
    userId: TEST_USER_ID,
    id: 'spend-603',
    amount: 14500,
    category: 'health',
    description: 'Annual Health Insurance Renewal',
    date: getRelativeDate(-5),
    createdAt: getIsoTimestamp(-5, 11, 0),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-604',
    userId: TEST_USER_ID,
    id: 'spend-604',
    amount: 1800,
    category: 'entertainment',
    description: 'IMAX Movie tickets & popcorn',
    date: getRelativeDate(-4),
    createdAt: getIsoTimestamp(-4, 21, 30),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-605',
    userId: TEST_USER_ID,
    id: 'spend-605',
    amount: 2400,
    category: 'food',
    description: 'Weekend family dinner',
    date: getRelativeDate(-6),
    createdAt: getIsoTimestamp(-6, 20, 15),
    updatedAt: nowIso,
  },
  // Last month comparison records
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-606',
    userId: TEST_USER_ID,
    id: 'spend-606',
    amount: 18500,
    category: 'bills',
    description: 'Quarterly electricity and society dues',
    date: getRelativeDate(-35),
    createdAt: getIsoTimestamp(-35),
    updatedAt: nowIso,
  },
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: 'SPEND#spend-607',
    userId: TEST_USER_ID,
    id: 'spend-607',
    amount: 9400,
    category: 'food',
    description: 'Last month groceries and dining out',
    date: getRelativeDate(-38),
    createdAt: getIsoTimestamp(-38),
    updatedAt: nowIso,
  },

  // ==========================================
  // BRIEFING (Today's cached AI briefing)
  // ==========================================
  {
    PK: `USER#${TEST_USER_ID}`,
    SK: `BRIEFING#${todayDate}`,
    userId: TEST_USER_ID,
    date: todayDate,
    content: `Good morning ${USER_NAME}! Today is Thursday, ${todayDate}.

🔴 Needs attention today:
- Broadband bill of ₹1,199 is 2 days overdue.
- Priority task: Submit Q3 TDS and Tax Invoices to your CA.
- Architecture Review with the Cloud Team at 11:00 AM on Google Meet.

🟡 Coming up soon:
- Electricity bill of ₹2,850 due in 2 days.
- Four-wheeler PUC certificate expires in 8 days.
- Family health insurance policy renewal due in 18 days.

✅ You're on top of:
- Annual health insurance is fully settled, and your daily hydration routines are on track.

Take a 5-minute breather before your 11 AM sync — you've got everything lined up for a productive day!`,
    generatedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

async function seed() {
  console.log(`Starting seed process for user: ${TEST_USER_ID}`);
  await ensureTableExists();

  let count = 0;
  for (const item of seedData) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );
    count++;
  }

  console.log(`Successfully seeded ${count} items into "${TABLE_NAME}" for user "${TEST_USER_ID}".`);
}

seed()
  .then(() => {
    console.log('Seed completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed script encountered an error:', err);
    process.exit(1);
  });
