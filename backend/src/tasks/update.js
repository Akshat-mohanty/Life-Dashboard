/**
 * Tasks - Update Lambda Function
 * PUT /tasks/{id}
 */

import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('TasksUpdateFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const taskId = event.pathParameters?.id;
    if (!taskId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    let body = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    } catch (parseErr) {
      return errorResponse(400, 'Invalid JSON payload in request body.');
    }

    // 1. Validate inputs BEFORE touching the database
    const updates = [];
    const expressionValues = {};
    const expressionNames = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return errorResponse(400, 'Validation Error: "title" must be a non-empty string.');
      }
      updates.push('#title = :title');
      expressionValues[':title'] = body.title.trim();
      expressionNames['#title'] = 'title';
    }

    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== 'string') {
        return errorResponse(400, 'Validation Error: "description" must be a string.');
      }
      updates.push('#description = :description');
      expressionValues[':description'] = (body.description || '').trim();
      expressionNames['#description'] = 'description';
    }

    if (body.dueDate !== undefined) {
      if (body.dueDate !== null && (typeof body.dueDate !== 'string' || isNaN(Date.parse(body.dueDate)))) {
        return errorResponse(400, 'Validation Error: "dueDate" must be a valid ISO date string or null.');
      }
      updates.push('#dueDate = :dueDate');
      expressionValues[':dueDate'] = body.dueDate ? body.dueDate.split('T')[0] : null;
      expressionNames['#dueDate'] = 'dueDate';
    }

    if (body.priority !== undefined) {
      const allowedPriorities = ['high', 'medium', 'low'];
      if (!allowedPriorities.includes(body.priority)) {
        return errorResponse(400, 'Validation Error: "priority" must be "high", "medium", or "low".');
      }
      updates.push('#priority = :priority');
      expressionValues[':priority'] = body.priority;
      expressionNames['#priority'] = 'priority';
    }

    if (body.isCompleted !== undefined) {
      if (typeof body.isCompleted !== 'boolean') {
        return errorResponse(400, 'Validation Error: "isCompleted" must be a boolean.');
      }
      updates.push('#isCompleted = :isCompleted');
      expressionValues[':isCompleted'] = Boolean(body.isCompleted);
      expressionNames['#isCompleted'] = 'isCompleted';
    }

    if (body.aiRank !== undefined) {
      if (typeof body.aiRank !== 'number' || body.aiRank < 1 || body.aiRank > 10) {
        return errorResponse(400, 'Validation Error: "aiRank" must be a number between 1 and 10.');
      }
      updates.push('#aiRank = :aiRank');
      expressionValues[':aiRank'] = Math.round(body.aiRank);
      expressionNames['#aiRank'] = 'aiRank';
    }

    // 2. Verify task exists in database
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `TASK#${taskId}`,
        },
      })
    );

    if (!existing.Item) {
      return errorResponse(404, `Task with id "${taskId}" not found.`);
    }

    if (updates.length === 0) {
      return successResponse(200, { item: existing.Item, message: 'No changes provided.' });
    }

    const timestamp = new Date().toISOString();
    updates.push('#updatedAt = :updatedAt');
    expressionValues[':updatedAt'] = timestamp;
    expressionNames['#updatedAt'] = 'updatedAt';

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `TASK#${taskId}`,
      },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    });

    const updateResult = await docClient.send(updateCommand);

    console.log(`Successfully updated task ${taskId} for user ${userId}`);
    return successResponse(200, { item: updateResult.Attributes });
  } catch (error) {
    console.error('Error in TasksUpdateFunction:', error);
    return errorResponse(500, 'Internal Server Error while updating task.', error.message);
  }
};
