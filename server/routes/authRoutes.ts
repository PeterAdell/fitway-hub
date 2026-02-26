import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, loginWithRememberToken, addOfflineSteps, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login-remember', loginWithRememberToken);
router.post('/offline-steps', authenticateToken, addOfflineSteps);
router.post('/update-profile', authenticateToken, updateProfile);

export default router;
