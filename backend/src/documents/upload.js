

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { s3Client, BUCKET_NAME } from '../utils/s3.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('DocumentsUploadFunction invoked with event:', JSON.stringify(event, null, 2));

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

    const {
      name,
      fileName,
      fileType = 'application/pdf',
      category = 'other',
      expiryDate = null,
    } = body;

    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "name" is required and must be a non-empty string.');
    }

    const allowedCategories = ['ID', 'insurance', 'certificate', 'medical', 'other'];
    if (!allowedCategories.includes(category)) {
      return errorResponse(400, 'Validation Error: "category" must be one of: "ID", "insurance", "certificate", "medical", "other".');
    }

    if (expiryDate !== null) {
      if (typeof expiryDate !== 'string' || isNaN(Date.parse(expiryDate))) {
        return errorResponse(400, 'Validation Error: "expiryDate" must be a valid ISO date string (YYYY-MM-DD) or null.');
      }
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const sanitizedFileName = (fileName || name)
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '_');

    
    const s3Key = `documents/${userId}/${id}-${sanitizedFileName}`;

    
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        userId,
        docId: id,
        category,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 900 });

    const newDocument = {
      PK: `USER#${userId}`,
      SK: `DOC#${id}`,
      userId,
      id,
      name: name.trim(),
      s3Key,
      fileType: typeof fileType === 'string' ? fileType.trim() : 'application/pdf',
      expiryDate: expiryDate ? expiryDate.split('T')[0] : null,
      category,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newDocument,
      })
    );

    console.log(`Generated upload URL and registered document ${id} for user ${userId}`);
    return successResponse(201, {
      item: newDocument,
      uploadUrl,
      s3Key,
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error('Error in DocumentsUploadFunction:', error);
    return errorResponse(500, 'Internal Server Error while creating document upload request.', error.message);
  }
};
