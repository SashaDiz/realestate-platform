import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for some S3-compatible services
});

export const bucketName = process.env.S3_BUCKET_NAME || '';

// Upload file to S3
export async function uploadFileToS3(
  file: Buffer | Uint8Array | string,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const key = `real-estate/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read', // Make file publicly accessible
  });

  try {
    await s3Client.send(command);
    // Return the public URL
    return `${process.env.S3_ENDPOINT}/${bucketName}/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Generate presigned URL for upload (client-side uploads)
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const key = `real-estate/${Date.now()}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });

  try {
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    const fileUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${key}`;
    
    return { uploadUrl, fileUrl };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

