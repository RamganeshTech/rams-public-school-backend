import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';
import { s3, S3_BUCKET } from '../config/awssdk';

export interface IUploadedFile {
  url: string;
  key: string;
  type: 'image' | 'pdf' | 'other';
  originalName: string;
  uploadedAt: Date;
}

// Generate a unique S3 key inside a folder
const generateS3Key = (originalName: string, folder: string): string => {
  const ext = path.extname(originalName);
  const uniqueId = uuidv4();
  return `${folder}/${uniqueId}${ext}`;
};

// Upload a single file to S3 (optimizes images via sharp, keeps PDFs as-is)
export const uploadFileToS3 = async (file: Express.Multer.File): Promise<IUploadedFile> => {
  let fileBuffer = file.buffer;
  let contentType = file.mimetype;
  let folder = 'others';
  let type: IUploadedFile['type'] = 'other';

  if (file.mimetype.startsWith('image/')) {
    folder = 'images';
    type = 'image';
    fileBuffer = await sharp(file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    contentType = 'image/jpeg';
  } else if (file.mimetype === 'application/pdf') {
    folder = 'pdfs';
    type = 'pdf';
  }

  const key = generateS3Key(file.originalname, folder);

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return {
    url: `https://${S3_BUCKET}.s3.amazonaws.com/${key}`,
    key,
    type,
    originalName: file.originalname,
    uploadedAt: new Date(),
  };
};

// Upload multiple files in parallel (handy if you add multi-file support later)
export const processFiles = async (
  filesArray: Express.Multer.File[]
): Promise<IUploadedFile[]> => {
  if (!filesArray || filesArray.length === 0) return [];
  return Promise.all(filesArray.map((file) => uploadFileToS3(file)));
};