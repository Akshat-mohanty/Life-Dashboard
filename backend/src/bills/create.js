/**
 * Bills - Create Lambda Function
 * POST /bills
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('BillsCreateFunction invoked with event:', JSON.stringify(event, null, 2));

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

    const { name, amount, dueDate, isPaid = false, isRecurring = false, frequency = null } = body;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "name" is required and must be a non-empty string.');
    }

    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return errorResponse(400, 'Validation Error: "amount" is required and must be a positive number.');
    }

    if (!dueDate || typeof dueDate !== 'string' || isNaN(Date.parse(dueDate))) {
      return errorResponse(400, 'Validation Error: "dueDate" is required and must be a valid ISO date string.');
    }

    if (typeof isPaid !== 'boolean') {
      return errorResponse(400, 'Validation Error: "isPaid" must be a boolean.');
    }

    if (typeof isRecurring !== 'boolean') {
      return errorResponse(400, 'Validation Error: "isRecurring" must be a boolean.');
    }

    const allowedFrequencies = ['monthly', 'weekly', 'yearly', null];
    if (frequency !== null && !allowedFrequencies.includes(frequency)) {
      return errorResponse(400, 'Validation Error: "frequency" must be one of: "monthly", "weekly", "yearly", or null.');
    }

    if (isRecurring && !frequency) {
      return errorResponse(400, 'Validation Error: Recurring bills must specify a valid frequency ("monthly", "weekly", "yearly").');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const newBill = {
      PK: `USER#${userId}`,
      SK: `BILL#${id}`,
      userId,
      id,
      name: name.trim(),
      amount: Number(amount),
      dueDate: dueDate.split('T')[0], // Standardize to YYYY-MM-DD
      isPaid: Boolean(isPaid),
      isRecurring: Boolean(isRecurring),
      frequency: isRecurring ? frequency : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newBill,
      })
    );

    console.log(`Successfully created bill ${id} for user ${userId}`);
    return successResponse(201, { item: newBill });
  } catch (error) {
    console.error('Error in BillsCreateFunction:', error);
    return errorResponse(500, 'Internal Server Error while creating bill.', error.message);
  }
};
