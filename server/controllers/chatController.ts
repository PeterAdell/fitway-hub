import { Request, Response } from 'express';
import db from '../config/database';

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const otherUserId = req.params.userId;

    const stmt = db.prepare(`
      SELECT m.*, 
             s.name as sender_name, s.avatar as sender_avatar
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
         AND m.challenge_id IS NULL AND m.group_id IS NULL
      ORDER BY m.created_at ASC
    `);

    const messages = stmt.all(userId, otherUserId, otherUserId, userId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

export const getChallengeMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const challengeId = req.params.challengeId;

    // Check if user is a participant
    const participantCheck = db.prepare('SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').get(challengeId, userId);
    if (!participantCheck) {
      return res.status(403).json({ message: 'Not a participant in this challenge' });
    }

    const stmt = db.prepare(`
      SELECT m.*, 
             s.name as sender_name, s.avatar as sender_avatar
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE m.challenge_id = ?
      ORDER BY m.created_at ASC
    `);

    const messages = stmt.all(challengeId);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching challenge messages:', error);
    res.status(500).json({ message: 'Failed to fetch challenge messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const { receiverId, challengeId, content } = req.body;
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if ((!receiverId && !challengeId) || (!content && !mediaUrl)) {
      return res.status(400).json({ message: 'Receiver ID or Challenge ID and content/media are required' });
    }

    let stmt;
    let params;

    if (challengeId) {
      // Check if user is a participant
      const participantCheck = db.prepare('SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').get(challengeId, senderId);
      if (!participantCheck) {
        return res.status(403).json({ message: 'Not a participant in this challenge' });
      }

      stmt = db.prepare(`
        INSERT INTO messages (sender_id, challenge_id, content, media_url)
        VALUES (?, ?, ?, ?)
      `);
      params = [senderId, challengeId, content, mediaUrl];
    } else {
      // Check if chat is accepted
      const chatCheck = db.prepare(`
        SELECT * FROM chat_requests 
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
        AND status = 'accepted'
      `).get(senderId, receiverId, receiverId, senderId);

      if (!chatCheck) {
        return res.status(403).json({ message: 'Chat not accepted' });
      }

      stmt = db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, content, media_url)
        VALUES (?, ?, ?, ?)
      `);
      params = [senderId, receiverId, content, mediaUrl];
    }

    const info = stmt.run(...params);
    
    const newMessage = db.prepare(`
      SELECT m.*, 
             s.name as sender_name, s.avatar as sender_avatar
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE m.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Get users who have exchanged messages with the current user, OR all coaches if user is a regular user
    // For simplicity, let's just return all coaches + users involved in chats
    
    const stmt = db.prepare(`
      SELECT id, name, avatar, role, is_premium 
      FROM users 
      WHERE id != ? 
      ORDER BY role = 'coach' DESC, name ASC
    `);
    
    const contacts = stmt.all(userId);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};
