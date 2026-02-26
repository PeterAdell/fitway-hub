import db from '../config/database';

export interface DailySummary {
  id: number;
  user_id: number;
  date: string;
  steps: number;
  ai_analysis: string;
  created_at: string;
}

export const DailySummaryModel = {
  create: (userId: number, date: string, steps: number, aiAnalysis: string): DailySummary => {
    const stmt = db.prepare('INSERT INTO daily_summaries (user_id, date, steps, ai_analysis) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, date, steps, aiAnalysis);
    return { id: Number(info.lastInsertRowid), user_id: userId, date, steps, ai_analysis: aiAnalysis, created_at: new Date().toISOString() };
  },

  findByUserAndDate: (userId: number, date: string): DailySummary | undefined => {
    const stmt = db.prepare('SELECT * FROM daily_summaries WHERE user_id = ? AND date = ?');
    return stmt.get(userId, date) as DailySummary | undefined;
  },

  findByUser: (userId: number): DailySummary[] => {
    const stmt = db.prepare('SELECT * FROM daily_summaries WHERE user_id = ? ORDER BY date DESC');
    return stmt.all(userId) as DailySummary[];
  }
};
