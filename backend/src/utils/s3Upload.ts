import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'scholarships',
        public_id: key,
        resource_type: 'auto', // Handles both images and raw files like PDFs
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            key: result.public_id,
            url: result.secure_url,
          });
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  // Cloudinary secure URLs are already public and secure.
  // We can just return the cloudinary URL directly if we construct it, 
  // but since we save the full URL in the DB, we might not even need this.
  // For safety, we generate the URL from the key:
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    const PORT = process.env.PORT || '5000';
    return `http://localhost:${PORT}/uploads/${key}`;
  }

  // Generate Cloudinary URL from public ID
  const url = cloudinary.url(key, { secure: true });
  return url;
}

export function generateS3Key(
  scholarshipId: string,
  applicationId: string,
  docType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  // Cloudinary public_ids shouldn't contain file extensions to avoid double extensions
  const nameWithoutExt = sanitizedName.split('.').slice(0, -1).join('.') || sanitizedName;
  return `${scholarshipId}/${applicationId}/${docType}/${timestamp}_${nameWithoutExt}`;
}
