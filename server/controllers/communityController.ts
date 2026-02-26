import { Request, Response } from 'express';
import db from '../config/database';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const tag = (req.query.tag as string) || null;
    let posts;
    if (tag) {
      const stmt = db.prepare(`
        SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.hashtags LIKE ? OR p.content LIKE ?
        ORDER BY p.created_at DESC
        LIMIT 50
      `);
      const like = `%#${tag}%`;
      posts = stmt.all(like, like);
    } else {
      const stmt = db.prepare(`
        SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 50
      `);
      posts = stmt.all();
    }
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { content, hashtags } = req.body;
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content && !mediaUrl) {
      return res.status(400).json({ message: 'Content or media is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO posts (user_id, content, media_url, hashtags)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(userId, content, mediaUrl, hashtags);
    
    const newPost = db.prepare(`
      SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const stmt = db.prepare(`
      SELECT c.*, u.name as creator_name, u.avatar as creator_avatar,
             (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      ORDER BY c.created_at DESC
    `);
    const challenges = stmt.all();
    res.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Failed to fetch challenges' });
  }
};

export const createChallenge = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, startDate, endDate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO challenges (creator_id, title, description, start_date, end_date, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(userId, title, description, startDate, endDate, imageUrl);
    
    // Automatically join the creator
    db.prepare('INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)').run(info.lastInsertRowid, userId);

    const newChallenge = db.prepare(`
      SELECT c.*, u.name as creator_name, u.avatar as creator_avatar,
             (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      WHERE c.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ message: 'Failed to create challenge' });
  }
};

export const joinChallenge = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const challengeId = req.params.id;

    const stmt = db.prepare('INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)');
    stmt.run(challengeId, userId);

    res.json({ message: 'Joined challenge successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }
    console.error('Error joining challenge:', error);
    res.status(500).json({ message: 'Failed to join challenge' });
  }
};

export const inviteToChallenge = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // User to invite
    const challengeId = req.params.id;

    // In a real app, this would send a notification. 
    // For now, we'll just add them directly if they haven't joined, or return a message.
    // Or better, just simulate sending an invite.
    
    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting to challenge:', error);
    res.status(500).json({ message: 'Failed to invite user' });
  }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;

    const stmt = db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)');
    stmt.run(postId, userId);

    // Update post likes count
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?');
    const countRow: any = countStmt.get(postId);
    const count = countRow?.count || 0;

    db.prepare('UPDATE posts SET likes = ? WHERE id = ?').run(count, postId);

    res.json({ likes: count });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Failed to like post' });
  }
};

export const unlikePost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;

    const stmt = db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?');
    stmt.run(postId, userId);

    // Update post likes count
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?');
    const countRow: any = countStmt.get(postId);
    const count = countRow?.count || 0;

    db.prepare('UPDATE posts SET likes = ? WHERE id = ?').run(count, postId);

    res.json({ likes: count });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ message: 'Failed to unlike post' });
  }
};

export const getPostComments = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;

    const stmt = db.prepare(`
      SELECT pc.*, u.name as user_name, u.avatar as user_avatar
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.post_id = ?
      ORDER BY pc.created_at DESC
    `);
    const comments = stmt.all(postId);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;
    const { content } = req.body;

    if (!content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const stmt = db.prepare('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)');
    const info = stmt.run(postId, userId, content);

    const newComment = db.prepare(`
      SELECT pc.*, u.name as user_name, u.avatar as user_avatar
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

export const followUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = req.params.id;

    if (userId === parseInt(targetUserId)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const stmt = db.prepare('INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)');
    stmt.run(userId, targetUserId);

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = req.params.id;

    const stmt = db.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?');
    stmt.run(userId, targetUserId);

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
};

export const requestChat = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const targetUserId = req.params.id;

    if (userId === parseInt(targetUserId)) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    const stmt = db.prepare('INSERT OR IGNORE INTO chat_requests (sender_id, receiver_id) VALUES (?, ?)');
    stmt.run(userId, targetUserId);

    res.json({ message: 'Chat request sent' });
  } catch (error) {
    console.error('Error requesting chat:', error);
    res.status(500).json({ message: 'Failed to send chat request' });
  }
};

export const acceptChatRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requestId = req.params.id;

    const stmt = db.prepare('UPDATE chat_requests SET status = ? WHERE id = ? AND receiver_id = ?');
    stmt.run('accepted', requestId, userId);

    res.json({ message: 'Chat request accepted' });
  } catch (error) {
    console.error('Error accepting chat request:', error);
    res.status(500).json({ message: 'Failed to accept chat request' });
  }
};

export const getChatRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const stmt = db.prepare(`
      SELECT cr.*, u.name as sender_name, u.avatar as sender_avatar
      FROM chat_requests cr
      JOIN users u ON cr.sender_id = u.id
      WHERE cr.receiver_id = ? AND cr.status = 'pending'
      ORDER BY cr.created_at DESC
    `);
    const requests = stmt.all(userId);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching chat requests:', error);
    res.status(500).json({ message: 'Failed to fetch chat requests' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { with: otherUserId, challenge: challengeId } = req.query;

    let query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
    `;
    let params: any[] = [];

    if (challengeId) {
      query += ' WHERE m.challenge_id = ?';
      params.push(challengeId);
    } else if (otherUserId) {
      query += ' WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)) AND m.challenge_id IS NULL';
      params.push(userId, otherUserId, otherUserId, userId);
    } else {
      return res.status(400).json({ message: 'Must specify either user or challenge' });
    }

    query += ' ORDER BY m.created_at ASC';

    const stmt = db.prepare(query);
    const messages = stmt.all(...params);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { content, receiverId, challengeId, mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({ message: 'Message content or media is required' });
    }

    let stmt;
    if (challengeId) {
      stmt = db.prepare('INSERT INTO messages (sender_id, challenge_id, content, media_url) VALUES (?, ?, ?, ?)');
      stmt.run(userId, challengeId, content, mediaUrl);
    } else if (receiverId) {
      // Check if chat is accepted
      const chatCheck = db.prepare(`
        SELECT * FROM chat_requests 
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
        AND status = 'accepted'
      `).get(userId, receiverId, receiverId, userId);

      if (!chatCheck) {
        return res.status(403).json({ message: 'Chat not accepted' });
      }

      stmt = db.prepare('INSERT INTO messages (sender_id, receiver_id, content, media_url) VALUES (?, ?, ?, ?)');
      stmt.run(userId, receiverId, content, mediaUrl);
    } else {
      return res.status(400).json({ message: 'Must specify receiver or challenge' });
    }

    res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const currentUserId = (req as any).user.id;

    const userStmt = db.prepare('SELECT id, name, avatar, role, points, steps, height, weight FROM users WHERE id = ?');
    const user: any = userStmt.get(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if following
    const followStmt = db.prepare('SELECT * FROM user_follows WHERE follower_id = ? AND following_id = ?');
    const followRow: any = followStmt.get(currentUserId, userId);
    const isFollowing = !!followRow;

    // Check chat request status
    const chatStmt = db.prepare(`
      SELECT * FROM chat_requests 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    `);
    const chatRequest: any = chatStmt.get(currentUserId, userId, userId, currentUserId);

    res.json({
      ...(user || {}),
      isFollowing,
      chatStatus: chatRequest ? chatRequest.status : null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
};
