

import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('HealthDeleteFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const reminderId = event.pathParameters?.id;
    if (!reminderId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `HEALTH#${reminderId}`,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await docClient.send(deleteCommand);

    if (!result.Attributes) {
      return errorResponse(404, `Health reminder with id "${reminderId}" not found.`);
    }

    console.log(`Successfully deleted health reminder ${reminderId} for user ${userId}`);
    return successResponse(200, {
      message: 'Health reminder deleted successfully.',
      id: reminderId,
      deletedItem: result.Attributes,
    });
  } catch (error) {
    console.error('Error in HealthDeleteFunction:', error);
    return errorResponse(500, 'Internal Server Error while deleting health reminder.', error.message);
  }
};
