

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('CalendarCreateFunction invoked with event:', JSON.stringify(event, null, 2));

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

    const { title, date, time = null, location = null, notes = null } = body;

    
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "title" is required and must be a non-empty string.');
    }

    if (!date || typeof date !== 'string' || isNaN(Date.parse(date))) {
      return errorResponse(400, 'Validation Error: "date" is required and must be a valid ISO date string (YYYY-MM-DD).');
    }

    if (time !== null && typeof time !== 'string') {
      return errorResponse(400, 'Validation Error: "time" must be a string or null.');
    }

    if (location !== null && typeof location !== 'string') {
      return errorResponse(400, 'Validation Error: "location" must be a string or null.');
    }

    if (notes !== null && typeof notes !== 'string') {
      return errorResponse(400, 'Validation Error: "notes" must be a string or null.');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const newEvent = {
      PK: `USER#${userId}`,
      SK: `EVENT#${id}`,
      userId,
      id,
      title: title.trim(),
      date: date.split('T')[0],
      time: time ? time.trim() : null,
      location: location ? location.trim() : null,
      notes: notes ? notes.trim() : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newEvent,
      })
    );

    console.log(`Successfully created calendar event ${id} for user ${userId}`);
    return successResponse(201, { item: newEvent });
  } catch (error) {
    console.error('Error in CalendarCreateFunction:', error);
    return errorResponse(500, 'Internal Server Error while creating calendar event.', error.message);
  }
};
