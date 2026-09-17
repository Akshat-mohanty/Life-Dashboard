/**
 * Spending - List Lambda Function
 * GET /spending
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('SpendingListFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const queryParams = event.queryStringParameters || {};
    const filterMonth = queryParams.month; // e.g. "2026-09"
    const filterCategory = queryParams.category; // e.g. "food"

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'SPEND#',
      },
    });

    const result = await docClient.send(command);
    let items = result.Items || [];

    // Optional filters
    if (filterMonth) {
      items = items.filter((item) => item.date && item.date.startsWith(filterMonth));
    }

    if (filterCategory) {
      items = items.filter((item) => item.category === filterCategory);
    }

    // Sort: newest first
    items.sort((a, b) => {
      if (a.date !== b.date) {
        return (b.date || '').localeCompare(a.date || '');
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    console.log(`Retrieved ${items.length} spending records for user ${userId}`);
    return successResponse(200, {
      items,
      totalCount: items.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      filterMonth: filterMonth || 'all',
      filterCategory: filterCategory || 'all',
    });
  } catch (error) {
    console.error('Error in SpendingListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing spending items.', error.message);
  }
};
