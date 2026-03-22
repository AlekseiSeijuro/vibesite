import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.YC_S3_REGION ?? 'ru-central1',
  endpoint: process.env.YC_S3_ENDPOINT ?? 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YC_S3_ACCESS_KEY!,
    secretAccessKey: process.env.YC_S3_SECRET_KEY!,
  },
})

const BUCKET = process.env.YC_S3_BUCKET_NAME ?? 'vibesite-storage'

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    })
  )

  return `${process.env.YC_S3_ENDPOINT}/${BUCKET}/${key}`
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  )
}

export function getS3Key(path: string): string {
  // Извлекает key из полного URL
  const base = `${process.env.YC_S3_ENDPOINT}/${BUCKET}/`
  return path.replace(base, '')
}
