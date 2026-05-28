import { S3Client } from '@aws-sdk/client-s3';

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
};

// Support MinIO / local S3-compatible endpoints
if (process.env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

export const s3Client = new S3Client(s3Config);
export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'scholarship-docs';
