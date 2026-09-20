

import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.S3_ENDPOINT || 
  (process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : undefined);

const s3ClientConfig = {
  region: REGION,
  forcePathStyle: Boolean(ENDPOINT), 
};

if (ENDPOINT) {
  s3ClientConfig.endpoint = ENDPOINT;
  s3ClientConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };
}

export const s3Client = new S3Client(s3ClientConfig);
export const BUCKET_NAME = process.env.BUCKET_NAME || 'life-dashboard-storage-local';
