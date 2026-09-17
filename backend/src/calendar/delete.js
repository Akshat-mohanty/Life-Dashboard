/**
 * Calendar - Delete Lambda Function
 * DELETE /calendar/{id}
 */

import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('CalendarDeleteFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `EVENT#${eventId}`,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await docClient.send(deleteCommand);

    if (!result.Attributes) {
      return errorResponse(404, `Calendar event with id "${eventId}" not found.`);
    }

    console.log(`Successfully deleted calendar event ${eventId} for user ${userId}`);
    return successResponse(200, {
      message: 'Calendar event deleted successfully.',
      id: eventId,
      deletedItem: result.Attributes,
    });
  } catch (error) {
    console.error('Error in CalendarDeleteFunction:', error);
    return errorResponse(500, 'Internal Server Error while deleting calendar event.', error.message);
  }
};
