import { Router } from 'express';
import { getMyPlan } from '../controllers/workoutsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/my-plan', authenticateToken, getMyPlan);

export default router;
