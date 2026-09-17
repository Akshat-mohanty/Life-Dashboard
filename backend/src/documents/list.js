/**
 * Documents - List Lambda Function
 * GET /documents
 * Lists user documents and attaches presigned download/view URLs
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { s3Client, BUCKET_NAME } from '../utils/s3.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('DocumentsListFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'DOC#',
      },
    });

    const result = await docClient.send(command);
    const rawItems = result.Items || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTimestamp = new Date(todayStr).getTime();
    const thirtyDaysLaterTimestamp = todayTimestamp + 30 * 24 * 60 * 60 * 1000;

    let expiringSoonCount = 0;
    let expiredCount = 0;

    // Attach presigned download/view URL and compute expiry calculations
    const items = await Promise.all(
      rawItems.map(async (doc) => {
        let downloadUrl = null;
        if (doc.s3Key) {
          try {
            const getObjCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: doc.s3Key,
            });
            downloadUrl = await getSignedUrl(s3Client, getObjCommand, { expiresIn: 3600 });
          } catch (signErr) {
            console.warn(`Could not generate presigned GET URL for key ${doc.s3Key}:`, signErr.message);
          }
        }

        let isExpired = false;
        let expiresSoon = false;
        let daysUntilExpiry = null;

        if (doc.expiryDate) {
          const expiryTimestamp = new Date(doc.expiryDate).getTime();
          const diffMs = expiryTimestamp - todayTimestamp;
          daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (expiryTimestamp < todayTimestamp) {
            isExpired = true;
            expiredCount += 1;
          } else if (expiryTimestamp <= thirtyDaysLaterTimestamp) {
            expiresSoon = true;
            expiringSoonCount += 1;
          }
        }

        return {
          ...doc,
          downloadUrl,
          isExpired,
          expiresSoon,
          daysUntilExpiry,
        };
      })
    );

    // Sort: Expired & expiring soonest first, then newest
    items.sort((a, b) => {
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      if (a.expiresSoon && !b.expiresSoon) return -1;
      if (!a.expiresSoon && b.expiresSoon) return 1;
      if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    const summary = {
      totalCount: items.length,
      expiringSoonCount,
      expiredCount,
    };

    console.log(`Retrieved ${items.length} documents for user ${userId}`);
    return successResponse(200, { items, summary });
  } catch (error) {
    console.error('Error in DocumentsListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing documents.', error.message);
  }
};
