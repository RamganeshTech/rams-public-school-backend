import { S3Client , GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import dotenv from 'dotenv';
dotenv.config();

export const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET as string;

export const getSignedUrlForKey = async (key: string, originalName?: string) => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: originalName
      ? `attachment; filename="${originalName}"`
      : "attachment",
  });

  // v3: presigning is a standalone function, not a client method
  return getSignedUrl(s3, command, { expiresIn: 60 * 15 }); // seconds, same 15 min
};