/**
 * Calendar - List Lambda Function
 * GET /calendar
 * Returns events for today and the next 7 days (or all if specified)
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('CalendarListFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const queryParams = event.queryStringParameters || {};
    const showAll = queryParams.all === 'true';

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const maxDateStr = sevenDaysLater.toISOString().split('T')[0];

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'EVENT#',
      },
    });

    const result = await docClient.send(command);
    const allEvents = result.Items || [];

    // Filter events for today and next 7 days by default
    const filteredEvents = showAll
      ? allEvents
      : allEvents.filter((item) => {
          if (!item.date) return false;
          return item.date >= todayStr && item.date <= maxDateStr;
        });

    // Sort chronologically by date and time
    filteredEvents.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    let todayCount = 0;
    let next7DaysCount = 0;

    filteredEvents.forEach((item) => {
      if (item.date === todayStr) {
        todayCount += 1;
      }
      if (item.date >= todayStr && item.date <= maxDateStr) {
        next7DaysCount += 1;
      }
    });

    const summary = {
      todayCount,
      next7DaysCount,
      totalCount: filteredEvents.length,
      todayStr,
      maxDateStr,
    };

    console.log(`Retrieved ${filteredEvents.length} calendar events for user ${userId}`);
    return successResponse(200, { items: filteredEvents, summary });
  } catch (error) {
    console.error('Error in CalendarListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing calendar events.', error.message);
  }
};
