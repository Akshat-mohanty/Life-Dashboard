

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('SpendingCreateFunction invoked with event:', JSON.stringify(event, null, 2));

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

    const { amount, category, description, date } = body;

    
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return errorResponse(400, 'Validation Error: "amount" is required and must be a positive number.');
    }

    const allowedCategories = ['food', 'transport', 'bills', 'health', 'entertainment', 'other'];
    if (!category || !allowedCategories.includes(category)) {
      return errorResponse(
        400,
        'Validation Error: "category" is required and must be one of: "food", "transport", "bills", "health", "entertainment", "other".'
      );
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "description" is required and must be a non-empty string.');
    }

    let expenseDate = date;
    if (!expenseDate) {
      expenseDate = new Date().toISOString().split('T')[0];
    } else if (typeof expenseDate !== 'string' || isNaN(Date.parse(expenseDate))) {
      return errorResponse(400, 'Validation Error: "date" must be a valid ISO date string (YYYY-MM-DD).');
    } else {
      expenseDate = expenseDate.split('T')[0];
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const newExpense = {
      PK: `USER#${userId}`,
      SK: `SPEND#${id}`,
      userId,
      id,
      amount: Math.round(Number(amount) * 100) / 100,
      category,
      description: description.trim(),
      date: expenseDate,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newExpense,
      })
    );

    console.log(`Successfully logged spending item ${id} for user ${userId}`);
    return successResponse(201, { item: newExpense });
  } catch (error) {
    console.error('Error in SpendingCreateFunction:', error);
    return errorResponse(500, 'Internal Server Error while logging spending.', error.message);
  }
};
