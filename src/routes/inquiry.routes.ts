import { Router } from 'express';
import { createInquiry, getInquiries } from '../controllers/inquiry.controller';

const inquiryRoutes = Router();

inquiryRoutes.post('/', createInquiry);
inquiryRoutes.get('/', getInquiries);

export default inquiryRoutes;