import { Request, Response } from 'express';
import db from '../config/database';

export const getMyAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Total steps from steps_entries
    const totalStepsRow: any = db.prepare('SELECT IFNULL(SUM(steps),0) as totalSteps FROM steps_entries WHERE user_id = ?').get(userId);
    const totalSteps = totalStepsRow?.totalSteps || 0;

    // Total distance from steps_entries + premium_sessions
    const distRow: any = db.prepare('SELECT IFNULL(SUM(distance_km),0) as dist FROM steps_entries WHERE user_id = ?').get(userId);
    const premiumDistRow: any = db.prepare('SELECT IFNULL(SUM(total_distance_km),0) as dist FROM premium_sessions WHERE user_id = ?').get(userId);
    const totalDistance = Number((distRow?.dist || 0) + (premiumDistRow?.dist || 0));

    // Total calories
    const calRow: any = db.prepare('SELECT IFNULL(SUM(calories_burned),0) as cal FROM steps_entries WHERE user_id = ?').get(userId);
    const premiumCalRow: any = db.prepare('SELECT IFNULL(SUM(calories),0) as cal FROM premium_sessions WHERE user_id = ?').get(userId);
    const totalCalories = Number((calRow?.cal || 0) + (premiumCalRow?.cal || 0));

    // Sessions count and recent sessions
    const sessionsCountRow: any = db.prepare('SELECT COUNT(*) as cnt FROM premium_sessions WHERE user_id = ?').get(userId);
    const sessionsCount = sessionsCountRow?.cnt || 0;
    const recentSessions = db.prepare('SELECT id, start_time, end_time, total_steps, total_distance_km, calories, path_json, created_at FROM premium_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

    // Weekly breakdown (last 7 days)
    const weeklyRows = db.prepare("SELECT date, steps FROM steps_entries WHERE user_id = ? AND date >= date('now','-6 days') ORDER BY date ASC").all(userId);

    res.json({
      totalSteps,
      totalDistance,
      totalCalories,
      sessionsCount,
      recentSessions,
      weekly: weeklyRows
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
