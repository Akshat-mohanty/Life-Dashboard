/**
 * Tasks - List Lambda Function
 * GET /tasks
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('TasksListFunction invoked with event:', JSON.stringify(event, null, 2));

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
        ':skPrefix': 'TASK#',
      },
    });

    const result = await docClient.send(command);
    const rawItems = result.Items || [];

    let completedCount = 0;
    let pendingCount = 0;
    let highPriorityCount = 0;

    for (const task of rawItems) {
      if (task.isCompleted) {
        completedCount += 1;
      } else {
        pendingCount += 1;
        if (task.priority === 'high') {
          highPriorityCount += 1;
        }
      }
    }

    // Sort: Incomplete tasks first (by aiRank ASC), completed tasks at the bottom
    const sortedItems = [...rawItems].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (!a.isCompleted) {
        const rankA = a.aiRank ?? 10;
        const rankB = b.aiRank ?? 10;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        // If ranks match, sort by due date
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

    const summary = {
      totalCount: rawItems.length,
      completedCount,
      pendingCount,
      highPriorityCount,
    };

    console.log(`Retrieved ${rawItems.length} tasks for user ${userId}`);
    return successResponse(200, { items: sortedItems, summary });
  } catch (error) {
    console.error('Error in TasksListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing tasks.', error.message);
  }
};
