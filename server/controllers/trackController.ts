import { Request, Response } from 'express';
import db from '../config/database';

export const saveSession = (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { startTime, endTime, totalSteps, totalDistanceKm, calories, path } = req.body;

    // Basic validation
    if (totalSteps != null && (typeof totalSteps !== 'number' || totalSteps < 0)) {
      return res.status(400).json({ message: 'Invalid totalSteps' });
    }
    if (totalDistanceKm != null && (typeof totalDistanceKm !== 'number' || totalDistanceKm < 0)) {
      return res.status(400).json({ message: 'Invalid totalDistanceKm' });
    }
    if (calories != null && (typeof calories !== 'number' || calories < 0)) {
      return res.status(400).json({ message: 'Invalid calories' });
    }
    if (path != null && !Array.isArray(path)) {
      return res.status(400).json({ message: 'Invalid path data' });
    }

    // Ensure user is premium
    const userRow: any = db.prepare('SELECT is_premium FROM users WHERE id = ?').get(userId);
    if (!userRow || !userRow.is_premium) {
      return res.status(403).json({ message: 'Premium feature. Upgrade required.' });
    }

    const stmt = db.prepare(`INSERT INTO premium_sessions
      (user_id, start_time, end_time, total_steps, total_distance_km, calories, path_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const info = stmt.run(
      userId,
      startTime || null,
      endTime || null,
      totalSteps != null ? totalSteps : 0,
      totalDistanceKm != null ? totalDistanceKm : 0,
      calories != null ? calories : 0,
      JSON.stringify(path || [])
    );

    return res.json({ ok: true, sessionId: info.lastInsertRowid });
  } catch (err: any) {
    console.error('saveSession error', err);
    return res.status(500).json({ message: 'Failed to save session' });
  }
};
