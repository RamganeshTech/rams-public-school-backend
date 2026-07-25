import { Router } from 'express';
import { applyCareer, deleteCareerById, getCareerById, getCareers } from '../controllers/career.controller';
import { parseFormData } from '../middleware/upload.middleware';
import { adminReadLimiter, submitFormLimiter } from '../middleware/rateLimiter.middleware';

const careerRoutes = Router();

careerRoutes.post('/apply',submitFormLimiter, parseFormData.single('resume'), applyCareer);
careerRoutes.get('/',adminReadLimiter, getCareers);


careerRoutes.get('/:id',adminReadLimiter, getCareerById);
careerRoutes.delete('/:id',adminReadLimiter, deleteCareerById);

export default careerRoutes;