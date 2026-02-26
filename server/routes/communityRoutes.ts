import express from 'express';
import { 
  getPosts, 
  createPost, 
  getChallenges, 
  createChallenge, 
  joinChallenge, 
  inviteToChallenge,
  likePost,
  unlikePost,
  getPostComments,
  addComment,
  followUser,
  unfollowUser,
  requestChat,
  acceptChatRequest,
  getChatRequests,
  getMessages,
  sendMessage,
  getUserProfile
} from '../controllers/communityController';
import { authenticateToken } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.get('/posts', authenticateToken, getPosts);
router.post('/posts', authenticateToken, upload.single('media'), createPost);
router.post('/posts/:id/like', authenticateToken, likePost);
router.delete('/posts/:id/like', authenticateToken, unlikePost);
router.get('/posts/:id/comments', authenticateToken, getPostComments);
router.post('/posts/:id/comments', authenticateToken, addComment);

router.get('/challenges', authenticateToken, getChallenges);
router.post('/challenges', authenticateToken, upload.single('image'), createChallenge);
router.post('/challenges/:id/join', authenticateToken, joinChallenge);
router.post('/challenges/:id/invite', authenticateToken, inviteToChallenge);

router.post('/users/:id/follow', authenticateToken, followUser);
router.delete('/users/:id/follow', authenticateToken, unfollowUser);
router.post('/users/:id/chat', authenticateToken, requestChat);
router.post('/chat-requests/:id/accept', authenticateToken, acceptChatRequest);
router.get('/chat-requests', authenticateToken, getChatRequests);
router.get('/messages', authenticateToken, getMessages);
router.post('/messages', authenticateToken, sendMessage);
router.get('/users/:id/profile', authenticateToken, getUserProfile);

export default router;
