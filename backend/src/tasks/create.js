/**
 * Tasks - Create Lambda Function
 * POST /tasks
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('TasksCreateFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    let body = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    } catch (parseErr) {
      return errorResponse(400, 'Invalid JSON payload in request body.');
    }

    const {
      title,
      description = '',
      dueDate = null,
      priority = 'medium',
      isCompleted = false,
      aiRank = null,
    } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "title" is required and must be a non-empty string.');
    }

    if (description !== null && typeof description !== 'string') {
      return errorResponse(400, 'Validation Error: "description" must be a string.');
    }

    if (dueDate !== null) {
      if (typeof dueDate !== 'string' || isNaN(Date.parse(dueDate))) {
        return errorResponse(400, 'Validation Error: "dueDate" must be a valid ISO date string or null.');
      }
    }

    const allowedPriorities = ['high', 'medium', 'low'];
    if (!allowedPriorities.includes(priority)) {
      return errorResponse(400, 'Validation Error: "priority" must be one of: "high", "medium", "low".');
    }

    if (typeof isCompleted !== 'boolean') {
      return errorResponse(400, 'Validation Error: "isCompleted" must be a boolean.');
    }

    let initialAiRank = aiRank;
    if (initialAiRank !== null) {
      if (typeof initialAiRank !== 'number' || initialAiRank < 1 || initialAiRank > 10) {
        return errorResponse(400, 'Validation Error: "aiRank" must be a number between 1 and 10.');
      }
    } else {
      // Default heuristic aiRank based on priority until Bedrock morning briefing runs
      const defaultRankMap = { high: 2, medium: 5, low: 8 };
      initialAiRank = defaultRankMap[priority] || 5;
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const newTask = {
      PK: `USER#${userId}`,
      SK: `TASK#${id}`,
      userId,
      id,
      title: title.trim(),
      description: (description || '').trim(),
      dueDate: dueDate ? dueDate.split('T')[0] : null,
      priority,
      isCompleted: Boolean(isCompleted),
      aiRank: Math.round(initialAiRank),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newTask,
      })
    );

    console.log(`Successfully created task ${id} for user ${userId}`);
    return successResponse(201, { item: newTask });
  } catch (error) {
    console.error('Error in TasksCreateFunction:', error);
    return errorResponse(500, 'Internal Server Error while creating task.', error.message);
  }
};
