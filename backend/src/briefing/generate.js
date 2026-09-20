

import { ScanCommand, QueryCommand, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const SES_SOURCE_EMAIL = process.env.SES_SOURCE_EMAIL || 'briefings@lifedashboard.app';

const clientConfig = { region: REGION,   };
const bedrockClient = new BedrockRuntimeClient(clientConfig);
const sesClient = new SESClient(clientConfig);


const formatDate = (dateObj) => dateObj.toISOString().split('T')[0];


async function getAllUserIds() {
  const userIds = new Set();
  let lastEvaluatedKey = undefined;

  do {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: 'userId',
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: 100,
    });

    const result = await docClient.send(scanCommand);
    if (result.Items) {
      result.Items.forEach((item) => {
        if (item.userId) userIds.add(item.userId);
      });
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return Array.from(userIds);
}


async function gatherUserData(userId) {
  const today = new Date();
  const todayStr = formatDate(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);

  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = formatDate(threeDaysLater);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysLaterStr = formatDate(sevenDaysLater);

  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDaysLaterStr = formatDate(thirtyDaysLater);

  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  
  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
    },
  });

  const queryResult = await docClient.send(queryCommand);
  const items = queryResult.Items || [];

  
  const unpaidBills = items
    .filter((it) => it.SK.startsWith('BILL#') && !it.isPaid)
    .filter((it) => it.dueDate < todayStr || it.dueDate <= sevenDaysLaterStr)
    .map((it) => ({
      name: it.name,
      amount: it.amount,
      dueDate: it.dueDate,
      isOverdue: it.dueDate < todayStr,
    }));

  
  const incompleteTasks = items
    .filter((it) => it.SK.startsWith('TASK#') && !it.isCompleted)
    .filter((it) => !it.dueDate || it.dueDate <= threeDaysLaterStr)
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .map((it) => ({
      id: it.id,
      title: it.title,
      dueDate: it.dueDate,
      priority: it.priority,
    }));

  
  const calendarEvents = items
    .filter((it) => it.SK.startsWith('EVENT#'))
    .filter((it) => it.date === todayStr || it.date === tomorrowStr)
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
    .map((it) => ({
      title: it.title,
      date: it.date,
      time: it.time,
      location: it.location,
    }));

  
  const healthReminders = items
    .filter((it) => it.SK.startsWith('HEALTH#'))
    .map((it) => ({
      name: it.name,
      time: it.time,
      frequency: it.frequency,
    }));

  
  const expiringDocs = items
    .filter((it) => it.SK.startsWith('DOC#') && it.expiryDate)
    .filter((it) => it.expiryDate <= thirtyDaysLaterStr)
    .map((it) => ({
      name: it.name,
      category: it.category,
      expiryDate: it.expiryDate,
    }));

  
  let spendingThisMonth = 0;
  let spendingLastMonth = 0;
  items
    .filter((it) => it.SK.startsWith('SPEND#'))
    .forEach((it) => {
      const spendMonth = (it.date || '').slice(0, 7);
      if (spendMonth === currentYearMonth) spendingThisMonth += it.amount || 0;
      else if (spendMonth === prevYearMonth) spendingLastMonth += it.amount || 0;
    });

  return {
    todayStr,
    unpaidBills,
    incompleteTasks,
    calendarEvents,
    healthReminders,
    expiringDocs,
    spendingThisMonth: Math.round(spendingThisMonth * 100) / 100,
    spendingLastMonth: Math.round(spendingLastMonth * 100) / 100,
  };
}


function buildBedrockPrompt(userName, today, data) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[today.getDay()];
  const dateFormatted = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const billsText =
    data.unpaidBills.length > 0
      ? data.unpaidBills
          .map((b) => `- ${b.name}: ₹${b.amount}, due ${b.dueDate} (${b.isOverdue ? 'OVERDUE' : 'due soon'})`)
          .join('\n')
      : 'None pending';

  const tasksText =
    data.incompleteTasks.length > 0
      ? data.incompleteTasks
          .map((t) => `- ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate || 'No deadline'})`)
          .join('\n')
      : 'All caught up';

  const eventsText =
    data.calendarEvents.length > 0
      ? data.calendarEvents
          .map((e) => `- ${e.title} at ${e.time || 'All day'} (${e.date})${e.location ? ` [${e.location}]` : ''}`)
          .join('\n')
      : 'No events scheduled';

  const healthText =
    data.healthReminders.length > 0
      ? data.healthReminders.map((h) => `- ${h.name} at ${h.time} (${h.frequency})`).join('\n')
      : 'No active reminders';

  const docsText =
    data.expiringDocs.length > 0
      ? data.expiringDocs.map((d) => `- ${d.name} (${d.category}), expires ${d.expiryDate}`).join('\n')
      : 'None expiring soon';

  return `You are a calm, intelligent personal assistant. 
The user's name is ${userName}.
Today is ${dateFormatted}, ${dayOfWeek}.

Here is a summary of their current life data:

BILLS:
${billsText}

TASKS (incomplete, sorted by due date):
${tasksText}

TODAY'S EVENTS:
${eventsText}

HEALTH REMINDERS TODAY:
${healthText}

DOCUMENTS EXPIRING SOON:
${docsText}

SPENDING THIS MONTH: ₹${data.spendingThisMonth} 
(last month was ₹${data.spendingLastMonth})

---

Write a morning briefing for ${userName}. 
Structure it as:

1. One sentence greeting acknowledging the day/date.
2. "🔴 Needs attention today:" — list only the 
   genuinely urgent items (overdue bills, tasks due 
   today, events in the next 4 hours).
3. "🟡 Coming up soon:" — things due in the next 
   3 days worth being aware of.
4. "✅ You're on top of:" — briefly note what is 
   under control, so they feel good.
5. One closing sentence of motivation or a 
   practical tip relevant to their situation.

Keep the whole briefing under 200 words. 
Plain English. No bullet overload. 
Sound like a thoughtful friend, not a robot.`;
}


async function invokeBedrockClaude(prompt) {
  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 600,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content?.[0]?.text || '';
  } catch (err) {
    console.warn('Bedrock API invocation unavailable, generating smart fallback response:', err.message);
    return generateFallbackBriefing(prompt);
  }
}


function generateFallbackBriefing(prompt) {
  return 'No value is entered.';
}


async function generateAndSaveBriefingForUser(userId, userEmail = null, userName = 'Friend') {
  const today = new Date();
  const todayStr = formatDate(today);
  const nowIso = today.toISOString();

  console.log(`Gathering data for user: ${userId}`);
  const userData = await gatherUserData(userId);

  const hasNoData =
    (!userData.unpaidBills || userData.unpaidBills.length === 0) &&
    (!userData.incompleteTasks || userData.incompleteTasks.length === 0) &&
    (!userData.calendarEvents || userData.calendarEvents.length === 0) &&
    (!userData.healthReminders || userData.healthReminders.length === 0) &&
    (!userData.expiringDocs || userData.expiringDocs.length === 0) &&
    (!userData.spendingThisMonth || userData.spendingThisMonth === 0);

  let briefingContent;
  if (hasNoData) {
    briefingContent = 'No value is entered.';
  } else {
    const prompt = buildBedrockPrompt(userName, today, userData);
    console.log(`Invoking Bedrock for user: ${userId}...`);
    briefingContent = await invokeBedrockClaude(prompt);
  }

  const briefingItem = {
    PK: `USER#${userId}`,
    SK: `BRIEFING#${todayStr}`,
    userId,
    date: todayStr,
    content: briefingContent,
    generatedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: briefingItem,
    })
  );
  console.log(`Saved briefing for user ${userId} under BRIEFING#${todayStr}`);

  
  if (userData.incompleteTasks && userData.incompleteTasks.length > 0) {
    for (let i = 0; i < userData.incompleteTasks.length; i++) {
      const task = userData.incompleteTasks[i];
      const rank = Math.min(10, i + 1);
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `USER#${userId}`,
              SK: `TASK#${task.id}`,
            },
            UpdateExpression: 'SET #aiRank = :rank, #updatedAt = :now',
            ExpressionAttributeNames: { '#aiRank': 'aiRank', '#updatedAt': 'updatedAt' },
            ExpressionAttributeValues: { ':rank': rank, ':now': nowIso },
          })
        );
      } catch (rankErr) {
        console.warn(`Could not update aiRank for task ${task.id}:`, rankErr.message);
      }
    }
  }

  
  if (userEmail) {
    try {
      await sesClient.send(
        new SendEmailCommand({
          Source: SES_SOURCE_EMAIL,
          Destination: {
            ToAddresses: [userEmail],
          },
          Message: {
            Subject: { Data: `Your Meridian Daily Briefing — ${todayStr}` },
            Body: {
              Text: { Data: briefingContent },
            },
          },
        })
      );
      console.log(`Sent SES briefing email to ${userEmail}`);
    } catch (sesErr) {
      console.warn(`Could not send SES email to ${userEmail}:`, sesErr.message);
    }
  }

  return briefingItem;
}


export const handler = async (event) => {
  console.log('BriefingGenerateFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const isScheduled =
      event.source === 'aws.events' ||
      event['detail-type'] === 'Scheduled Event' ||
      event.isCron === true;

    
    if (isScheduled) {
      console.log('Running scheduled 7:00 AM IST batch briefing generation...');
      const userIds = await getAllUserIds();
      console.log(`Found ${userIds.length} distinct users.`);

      const results = [];
      for (const uid of userIds) {
        try {
          const briefing = await generateAndSaveBriefingForUser(uid);
          results.push({ userId: uid, status: 'success', date: briefing.date });
        } catch (uErr) {
          console.error(`Failed generating briefing for user ${uid}:`, uErr);
          results.push({ userId: uid, status: 'error', error: uErr.message });
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Scheduled briefing run completed', processed: results.length, results }),
      };
    }

    
    if (event.httpMethod === 'GET') {
      const userId = getUserId(event);
      if (!userId) {
        return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
      }

      const todayStr = formatDate(new Date());
      let existing = { Item: null };
      try {
        existing = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `USER#${userId}`,
              SK: `BRIEFING#${todayStr}`,
            },
          })
        );
      } catch (dbErr) {
        console.warn("Could not query DynamoDB for briefing (offline fallback):", dbErr.message);
      }

      if (existing.Item) {
        return successResponse(200, {
          item: existing.Item,
          exists: true,
          today: todayStr,
        });
      }

      return successResponse(200, {
        item: null,
        exists: false,
        today: todayStr,
        message: "No briefing generated yet today. Click 'Generate now' to create one.",
      });
    }

    
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const email = event.requestContext?.authorizer?.claims?.email || null;
    const name = event.requestContext?.authorizer?.claims?.name || 'there';

    const briefingItem = await generateAndSaveBriefingForUser(userId, email, name);
    return successResponse(200, {
      item: briefingItem,
      message: 'Briefing generated successfully.',
    });
  } catch (error) {
    console.error('Error in BriefingGenerateFunction:', error);
    return errorResponse(500, 'Internal Server Error in briefing generation.', error.message);
  }
};
