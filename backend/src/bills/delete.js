/**
 * Bills - Delete Lambda Function
 * DELETE /bills/{id}
 */

import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('BillsDeleteFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const billId = event.pathParameters?.id;
    if (!billId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `BILL#${billId}`,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await docClient.send(deleteCommand);

    if (!result.Attributes) {
      return errorResponse(404, `Bill with id "${billId}" not found.`);
    }

    console.log(`Successfully deleted bill ${billId} for user ${userId}`);
    return successResponse(200, {
      message: 'Bill deleted successfully.',
      id: billId,
      deletedItem: result.Attributes,
    });
  } catch (error) {
    console.error('Error in BillsDeleteFunction:', error);
    return errorResponse(500, 'Internal Server Error while deleting bill.', error.message);
  }
};
