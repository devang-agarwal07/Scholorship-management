import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET } from '../config/s3';
import fs from 'fs';
import path from 'path';

export async function uploadToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.warn('⚠️ S3 upload failed, falling back to local storage:', (error as Error).message);
    const localPath = path.join(__dirname, '../../../uploads', key);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, fileBuffer);
    return `local::${key}`;
  }
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  if (key.startsWith('local::')) {
    const cleanKey = key.replace('local::', '');
    const PORT = process.env.PORT || '5000';
    return `http://localhost:${PORT}/uploads/${cleanKey}`;
  }
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await awsGetSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
  } catch (error) {
    console.warn('⚠️ S3 URL retrieval failed, returning local fallback URL');
    const PORT = process.env.PORT || '5000';
    return `http://localhost:${PORT}/uploads/${key}`;
  }
}

export function generateS3Key(
  scholarshipId: string,
  applicationId: string,
  docType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `scholarships/${scholarshipId}/${applicationId}/${docType}/${timestamp}_${sanitizedName}`;
}
