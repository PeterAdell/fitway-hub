import { Router } from 'express';
import { addPoints } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/points', authenticateToken, addPoints);

export default router;
