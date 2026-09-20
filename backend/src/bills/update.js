

import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('BillsUpdateFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const billId = event.pathParameters?.id;
    if (!billId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    let body = {};
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    } catch (parseErr) {
      return errorResponse(400, 'Invalid JSON payload in request body.');
    }

    
    const updates = [];
    const expressionValues = {};
    const expressionNames = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return errorResponse(400, 'Validation Error: "name" must be a non-empty string.');
      }
      updates.push('#name = :name');
      expressionValues[':name'] = body.name.trim();
      expressionNames['#name'] = 'name';
    }

    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || isNaN(body.amount) || body.amount <= 0) {
        return errorResponse(400, 'Validation Error: "amount" must be a positive number.');
      }
      updates.push('#amount = :amount');
      expressionValues[':amount'] = Number(body.amount);
      expressionNames['#amount'] = 'amount';
    }

    if (body.dueDate !== undefined) {
      if (typeof body.dueDate !== 'string' || isNaN(Date.parse(body.dueDate))) {
        return errorResponse(400, 'Validation Error: "dueDate" must be a valid ISO date string.');
      }
      updates.push('#dueDate = :dueDate');
      expressionValues[':dueDate'] = body.dueDate.split('T')[0];
      expressionNames['#dueDate'] = 'dueDate';
    }

    if (body.isPaid !== undefined) {
      if (typeof body.isPaid !== 'boolean') {
        return errorResponse(400, 'Validation Error: "isPaid" must be a boolean.');
      }
      updates.push('#isPaid = :isPaid');
      expressionValues[':isPaid'] = Boolean(body.isPaid);
      expressionNames['#isPaid'] = 'isPaid';
    }

    if (body.isRecurring !== undefined) {
      if (typeof body.isRecurring !== 'boolean') {
        return errorResponse(400, 'Validation Error: "isRecurring" must be a boolean.');
      }
      updates.push('#isRecurring = :isRecurring');
      expressionValues[':isRecurring'] = Boolean(body.isRecurring);
      expressionNames['#isRecurring'] = 'isRecurring';
    }

    if (body.frequency !== undefined) {
      const allowedFrequencies = ['monthly', 'weekly', 'yearly', null];
      if (!allowedFrequencies.includes(body.frequency)) {
        return errorResponse(400, 'Validation Error: "frequency" must be "monthly", "weekly", "yearly", or null.');
      }
      updates.push('#frequency = :frequency');
      expressionValues[':frequency'] = body.frequency;
      expressionNames['#frequency'] = 'frequency';
    }

    
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `BILL#${billId}`,
        },
      })
    );

    if (!existing.Item) {
      return errorResponse(404, `Bill with id "${billId}" not found.`);
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
        SK: `BILL#${billId}`,
      },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    });

    const updateResult = await docClient.send(updateCommand);

    console.log(`Successfully updated bill ${billId} for user ${userId}`);
    return successResponse(200, { item: updateResult.Attributes });
  } catch (error) {
    console.error('Error in BillsUpdateFunction:', error);
    return errorResponse(500, 'Internal Server Error while updating bill.', error.message);
  }
};
