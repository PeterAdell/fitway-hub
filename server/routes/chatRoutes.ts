import express from 'express';
import { getChatHistory, sendMessage, getContacts, getChallengeMessages } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.get('/history/:userId', authenticateToken, getChatHistory);
router.get('/challenge/:challengeId', authenticateToken, getChallengeMessages);
router.post('/send', authenticateToken, upload.single('media'), sendMessage);
router.get('/contacts', authenticateToken, getContacts);

export default router;
