

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('UserProfileGetFunction invoked:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    });

    const result = await docClient.send(command);

    if (result.Item) {
      return successResponse(200, {
        profile: {
          userId: result.Item.userId || userId,
          name: result.Item.name,
          email: result.Item.email,
          avatarUrl: result.Item.avatarUrl || '',
          defaultCurrency: result.Item.defaultCurrency || 'INR',
          updatedAt: result.Item.updatedAt,
        },
      });
    }

    
    const claims = event?.requestContext?.authorizer?.claims;
    const defaultName = claims?.name || claims?.email?.split('@')[0] || (userId === 'demo-user-1' ? 'Akshat Mohanty' : 'User');
    const defaultEmail = claims?.email || `${userId}@example.com`;

    return successResponse(200, {
      profile: {
        userId,
        name: defaultName,
        email: defaultEmail,
        avatarUrl: '',
        defaultCurrency: 'INR',
        isDefault: true,
      },
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return errorResponse(500, 'Internal Server Error: Failed to retrieve user profile.', {
      detail: err.message,
    });
  }
};
