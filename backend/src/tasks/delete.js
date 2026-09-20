

import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('TasksDeleteFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const taskId = event.pathParameters?.id;
    if (!taskId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `TASK#${taskId}`,
      },
      ReturnValues: 'ALL_OLD',
    });

    const result = await docClient.send(deleteCommand);

    if (!result.Attributes) {
      return errorResponse(404, `Task with id "${taskId}" not found.`);
    }

    console.log(`Successfully deleted task ${taskId} for user ${userId}`);
    return successResponse(200, {
      message: 'Task deleted successfully.',
      id: taskId,
      deletedItem: result.Attributes,
    });
  } catch (error) {
    console.error('Error in TasksDeleteFunction:', error);
    return errorResponse(500, 'Internal Server Error while deleting task.', error.message);
  }
};
