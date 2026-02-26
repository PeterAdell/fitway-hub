import { Request, Response } from 'express';
import db from '../config/database';

export interface StepsEntry {
  id: number;
  user_id: number;
  date: string;
  steps: number;
  calories_burned?: number;
  distance_km?: number;
  notes?: string;
  created_at: string;
}

// Get all step entries for a user
export const getStepsHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stmt = db.prepare(`
      SELECT id, user_id, date, steps, calories_burned, distance_km, notes, created_at
      FROM steps_entries 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 90
    `);
    const entries = stmt.all(userId) as StepsEntry[];

    res.json({ entries, total: entries.length });
  } catch (error) {
    console.error('Get steps history error:', error);
    res.status(500).json({ message: 'Error fetching steps history' });
  }
};

// Get steps for a specific date
export const getStepsByDate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stmt = db.prepare(`
      SELECT id, user_id, date, steps, calories_burned, distance_km, notes, created_at
      FROM steps_entries 
      WHERE user_id = ? AND date = ?
    `);
    const entry = stmt.get(userId, date) as StepsEntry | undefined;

    if (!entry) {
      return res.json({ entry: null, message: 'No data for this date' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Get steps error:', error);
    res.status(500).json({ message: 'Error fetching steps' });
  }
};

// Add or update steps for a date
export const addSteps = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date, steps, caloriesBurned, distanceKm, notes, trackingMode } = req.body;

    if (!userId || !date || steps === undefined) {
      return res.status(400).json({ message: 'Missing required fields: date, steps' });
    }

    if (typeof steps !== 'number' || steps < 0 || steps > 100000) {
      return res.status(400).json({ message: 'Steps must be a number between 0 and 100000' });
    }

    // Check if entry exists
    const checkStmt = db.prepare('SELECT id FROM steps_entries WHERE user_id = ? AND date = ?');
    const existing = checkStmt.get(userId, date);

    if (existing) {
      // Update existing
      const updateStmt = db.prepare(`
        UPDATE steps_entries 
        SET steps = ?, calories_burned = ?, distance_km = ?, notes = ?, tracking_mode = ?
        WHERE user_id = ? AND date = ?
      `);
      updateStmt.run(steps, caloriesBurned || null, distanceKm || null, notes || null, trackingMode || 'manual', userId, date);
      
      return res.json({ message: 'Steps updated successfully', date, steps });
    } else {
      // Create new
      const insertStmt = db.prepare(`
        INSERT INTO steps_entries (user_id, date, steps, calories_burned, distance_km, notes, tracking_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = insertStmt.run(userId, date, steps, caloriesBurned || null, distanceKm || null, notes || null, trackingMode || 'manual');

      return res.json({ 
        message: 'Steps added successfully', 
        entry_id: info.lastInsertRowid,
        date,
        steps
      });
    }
  } catch (error) {
    console.error('Add steps error:', error);
    res.status(500).json({ message: 'Error adding steps' });
  }
};

// Get weekly stats
export const getWeeklyStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get last 7 days
    const stmt = db.prepare(`
      SELECT date, steps, calories_burned, distance_km
      FROM steps_entries 
      WHERE user_id = ? 
      AND date >= date('now', '-7 days')
      ORDER BY date ASC
    `);
    const entries = stmt.all(userId) as StepsEntry[];

    const totalSteps = entries.reduce((sum, e) => sum + e.steps, 0);
    const avgSteps = entries.length > 0 ? Math.round(totalSteps / entries.length) : 0;
    const maxSteps = entries.length > 0 ? Math.max(...entries.map(e => e.steps)) : 0;
    const totalCalories = entries.reduce((sum, e) => sum + (e.calories_burned || 0), 0);

    res.json({
      weeklyStats: {
        totalSteps,
        avgSteps,
        maxSteps,
        totalCalories,
        daysTracked: entries.length,
        entries
      }
    });
  } catch (error) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ message: 'Error fetching weekly stats' });
  }
};

// Get monthly stats
export const getMonthlyStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stmt = db.prepare(`
      SELECT date, steps, calories_burned, distance_km
      FROM steps_entries 
      WHERE user_id = ? 
      AND date >= date('now', '-30 days')
      ORDER BY date ASC
    `);
    const entries = stmt.all(userId) as StepsEntry[];

    const totalSteps = entries.reduce((sum, e) => sum + e.steps, 0);
    const avgSteps = entries.length > 0 ? Math.round(totalSteps / entries.length) : 0;
    const maxSteps = entries.length > 0 ? Math.max(...entries.map(e => e.steps)) : 0;
    const totalCalories = entries.reduce((sum, e) => sum + (e.calories_burned || 0), 0);

    res.json({
      monthlyStats: {
        totalSteps,
        avgSteps,
        maxSteps,
        totalCalories,
        daysTracked: entries.length,
        entries
      }
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ message: 'Error fetching monthly stats' });
  }
};

// Delete a step entry
export const deleteSteps = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stmt = db.prepare('DELETE FROM steps_entries WHERE user_id = ? AND date = ?');
    stmt.run(userId, date);

    res.json({ message: 'Steps entry deleted successfully' });
  } catch (error) {
    console.error('Delete steps error:', error);
    res.status(500).json({ message: 'Error deleting steps' });
  }
};
