import { Router } from 'express';
import {
  getStepsHistory,
  getStepsByDate,
  addSteps,
  getWeeklyStats,
  getMonthlyStats,
  deleteSteps
} from '../controllers/stepsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all steps history
router.get('/history', authenticateToken, getStepsHistory);

// Get weekly stats
router.get('/stats/weekly', authenticateToken, getWeeklyStats);

// Get monthly stats
router.get('/stats/monthly', authenticateToken, getMonthlyStats);

// Get steps for specific date
router.get('/:date', authenticateToken, getStepsByDate);

// Add or update steps
router.post('/add', authenticateToken, addSteps);

// Delete steps for a date
router.delete('/:date', authenticateToken, deleteSteps);

export default router;
