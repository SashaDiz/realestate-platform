import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Настройка для игнорирования ошибок самоподписанных сертификатов
// Можно переопределить через переменную окружения ALLOW_SELF_SIGNED_CERT=true
const allowSelfSignedCert = process.env.ALLOW_SELF_SIGNED_CERT === 'true' || process.env.NODE_ENV !== 'production';

// Если нужно игнорировать ошибки сертификата, устанавливаем глобальную переменную
// (используется только если ALLOW_SELF_SIGNED_CERT=true)
if (allowSelfSignedCert && typeof process !== 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://s3.twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true, // Обязательно для S3-совместимых сервисов
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  const key = `real-estate/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;

  return {
    success: true,
    url,
    filename: fileName,
    size: file.length,
    type: contentType,
  };
}

export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Extract key from URL
  const urlParts = fileUrl.split('/');
  const key = urlParts.slice(urlParts.indexOf(BUCKET_NAME) + 1).join('/');

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const key = `real-estate/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;

  return { uploadUrl, fileUrl };
}

