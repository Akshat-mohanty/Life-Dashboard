

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('HealthListFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'HEALTH#',
      },
    });

    const result = await docClient.send(command);
    const rawItems = result.Items || [];

    let dailyCount = 0;
    let weeklyCount = 0;
    let customCount = 0;
    let smsAlertsEnabledCount = 0;

    for (const item of rawItems) {
      if (item.frequency === 'daily') dailyCount += 1;
      else if (item.frequency === 'weekly') weeklyCount += 1;
      else customCount += 1;

      if (item.phoneNumber) smsAlertsEnabledCount += 1;
    }

    
    const sortedItems = [...rawItems].sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    const summary = {
      totalCount: rawItems.length,
      dailyCount,
      weeklyCount,
      customCount,
      smsAlertsEnabledCount,
    };

    console.log(`Retrieved ${rawItems.length} health reminders for user ${userId}`);
    return successResponse(200, { items: sortedItems, summary });
  } catch (error) {
    console.error('Error in HealthListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing health reminders.', error.message);
  }
};
