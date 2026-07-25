import { Router } from 'express';
import { createInquiry, deleteInquiryById, getInquiries, getInquiryById } from '../controllers/inquiry.controller';
import { adminReadLimiter, submitFormLimiter } from '../middleware/rateLimiter.middleware';

const inquiryRoutes = Router();

inquiryRoutes.post('/',submitFormLimiter, createInquiry);
inquiryRoutes.get('/',adminReadLimiter, getInquiries);
inquiryRoutes.get('/:id',adminReadLimiter, getInquiryById);
inquiryRoutes.delete('/:id',adminReadLimiter, deleteInquiryById);

export default inquiryRoutes;