/**
 * User Profile - Update Lambda Function
 * PUT /user/profile
 * Updates user name and avatarUrl in DynamoDB with strict user isolation (PK = USER#{userId})
 */

import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('UserProfileUpdateFunction invoked:', JSON.stringify(event, null, 2));

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

    const { name, avatarUrl } = body;

    // Validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return errorResponse(400, 'Validation Error: "name" must be a non-empty string.');
      }
      if (name.length > 100) {
        return errorResponse(400, 'Validation Error: "name" must not exceed 100 characters.');
      }
    }

    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      return errorResponse(400, 'Validation Error: "avatarUrl" must be a string.');
    }

    const claims = event?.requestContext?.authorizer?.claims;
    const email = claims?.email || `${userId}@example.com`;
    const now = new Date().toISOString();

    const updates = ['#userId = :userId', '#email = :email', '#updatedAt = :updatedAt'];
    const expressionValues = {
      ':userId': userId,
      ':email': email,
      ':updatedAt': now,
    };
    const expressionNames = {
      '#userId': 'userId',
      '#email': 'email',
      '#updatedAt': 'updatedAt',
    };

    if (name !== undefined) {
      updates.push('#name = :name');
      expressionValues[':name'] = name.trim();
      expressionNames['#name'] = 'name';
    }

    if (avatarUrl !== undefined) {
      updates.push('#avatarUrl = :avatarUrl');
      expressionValues[':avatarUrl'] = avatarUrl || '';
      expressionNames['#avatarUrl'] = 'avatarUrl';
    }

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);

    return successResponse(200, {
      message: 'Profile updated successfully in database.',
      profile: {
        userId: result.Attributes.userId,
        name: result.Attributes.name,
        email: result.Attributes.email,
        avatarUrl: result.Attributes.avatarUrl || '',
        updatedAt: result.Attributes.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    return errorResponse(500, 'Internal Server Error: Failed to update user profile in database.', {
      detail: err.message,
    });
  }
};
