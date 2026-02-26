import { Router } from 'express';
import { bookSession } from '../controllers/coachingController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/book', authenticateToken, bookSession);

export default router;
