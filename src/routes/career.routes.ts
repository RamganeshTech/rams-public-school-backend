import { Router } from 'express';
import { applyCareer, getCareers } from '../controllers/career.controller';
import { parseFormData } from '../middleware/upload.middleware';

const careerRoutes = Router();

careerRoutes.post('/apply', parseFormData.single('resume'), applyCareer);
careerRoutes.get('/', getCareers);

export default careerRoutes;