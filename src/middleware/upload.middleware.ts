import multer from 'multer';

// Just parses multipart/form-data into memory.
// No S3 logic here — that's handled inside the controller.
export const parseFormData = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
});