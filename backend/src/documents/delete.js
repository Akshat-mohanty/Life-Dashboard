/**
 * Documents - Delete Lambda Function
 * DELETE /documents/{id}
 * Deletes the S3 file object and DynamoDB record
 */

import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { s3Client, BUCKET_NAME } from '../utils/s3.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('DocumentsDeleteFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const docId = event.pathParameters?.id;
    if (!docId) {
      return errorResponse(400, 'Missing required path parameter: "id".');
    }

    // 1. Fetch document metadata to retrieve S3 key
    const existing = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DOC#${docId}`,
        },
      })
    );

    if (!existing.Item) {
      return errorResponse(404, `Document with id "${docId}" not found.`);
    }

    const s3Key = existing.Item.s3Key;

    // 2. Delete file from S3 if s3Key is present
    if (s3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          })
        );
        console.log(`Deleted S3 object: ${s3Key}`);
      } catch (s3Err) {
        console.warn(`Could not delete S3 object ${s3Key} (it may not exist):`, s3Err.message);
      }
    }

    // 3. Delete metadata from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `DOC#${docId}`,
        },
      })
    );

    console.log(`Successfully deleted document record ${docId} for user ${userId}`);
    return successResponse(200, {
      message: 'Document and associated S3 file deleted successfully.',
      id: docId,
      deletedItem: existing.Item,
    });
  } catch (error) {
    console.error('Error in DocumentsDeleteFunction:', error);
    return errorResponse(500, 'Internal Server Error while deleting document.', error.message);
  }
};
