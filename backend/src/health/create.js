/**
 * Health - Create Lambda Function
 * POST /health
 */

import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.SNS_ENDPOINT || 
  (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : undefined);
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const snsClient = new SNSClient({
  region: REGION,
  ...(ENDPOINT
    ? {
        endpoint: ENDPOINT,
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      }
    : {}),
});

export const handler = async (event) => {
  console.log('HealthCreateFunction invoked with event:', JSON.stringify(event, null, 2));

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

    const { name, frequency = 'daily', time, phoneNumber = null } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse(400, 'Validation Error: "name" is required and must be a non-empty string.');
    }

    const allowedFrequencies = ['daily', 'weekly', 'custom'];
    if (!allowedFrequencies.includes(frequency)) {
      return errorResponse(400, 'Validation Error: "frequency" must be one of: "daily", "weekly", "custom".');
    }

    // Time validation (HH:mm format, e.g. "08:00" or "18:30")
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!time || typeof time !== 'string' || !timeRegex.test(time.trim())) {
      return errorResponse(400, 'Validation Error: "time" is required and must be in 24-hour HH:mm format (e.g. "08:00").');
    }

    if (phoneNumber !== null && (typeof phoneNumber !== 'string' || phoneNumber.trim().length < 7)) {
      return errorResponse(400, 'Validation Error: "phoneNumber" must be a valid E.164 phone string (e.g. "+919876543210") or null.');
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const newReminder = {
      PK: `USER#${userId}`,
      SK: `HEALTH#${id}`,
      userId,
      id,
      name: name.trim(),
      frequency,
      time: time.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      lastTriggered: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newReminder,
      })
    );

    let snsStatus = 'none';
    // Optional SNS confirmation alert if phone number is configured
    if (newReminder.phoneNumber) {
      try {
        const smsMessage = `[Meridian] Health reminder created: "${newReminder.name}" at ${newReminder.time} (${newReminder.frequency}).`;
        await snsClient.send(
          new PublishCommand({
            PhoneNumber: newReminder.phoneNumber,
            Message: smsMessage,
          })
        );
        snsStatus = 'sent_sms';
        console.log(`SNS SMS dispatched to ${newReminder.phoneNumber}`);
      } catch (snsErr) {
        console.warn('SNS SMS dispatch failed (likely sandbox or permissions):', snsErr.message);
        snsStatus = `failed: ${snsErr.message}`;
      }
    } else if (SNS_TOPIC_ARN) {
      try {
        await snsClient.send(
          new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: 'Meridian Health Reminder Registered',
            Message: JSON.stringify({
              userId,
              reminderId: id,
              name: newReminder.name,
              time: newReminder.time,
              frequency: newReminder.frequency,
            }),
          })
        );
        snsStatus = 'published_to_topic';
      } catch (topicErr) {
        console.warn('SNS Topic publish failed:', topicErr.message);
        snsStatus = `topic_failed: ${topicErr.message}`;
      }
    }

    console.log(`Successfully created health reminder ${id} for user ${userId}`);
    return successResponse(201, { item: newReminder, snsStatus });
  } catch (error) {
    console.error('Error in HealthCreateFunction:', error);
    return errorResponse(500, 'Internal Server Error while creating health reminder.', error.message);
  }
};
