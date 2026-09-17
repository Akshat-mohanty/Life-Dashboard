/**
 * DynamoDB Document Client Setup
 * Configures endpoints automatically for LocalStack or AWS Cloud
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.DYNAMODB_ENDPOINT || 
  (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : undefined);

const clientConfig = {
  region: REGION,
};

if (ENDPOINT) {
  clientConfig.endpoint = ENDPOINT;
}

// Fallback credentials for local testing without requiring ~/.aws/credentials
if (!process.env.AWS_ACCESS_KEY_ID) {
  clientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };
}

const rawClient = new DynamoDBClient(clientConfig);

export const docClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLE_NAME = process.env.TABLE_NAME || 'LifeDashboard';
