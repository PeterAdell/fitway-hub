import db from '../config/database';

export interface User {
  id: number;
  email: string;
  password?: string;
  name?: string;
  role?: string;
  avatar?: string;
  is_premium?: number;
  points?: number;
  steps?: number;
  height?: number;
  weight?: number;
  created_at: string;
}

export const UserModel = {
  create: (email: string, passwordHash: string): User => {
    const stmt = db.prepare('INSERT INTO users (email, password, is_premium) VALUES (?, ?, 1)');
    const info = stmt.run(email, passwordHash);
    return { id: Number(info.lastInsertRowid), email, created_at: new Date().toISOString() };
  },

  findByEmail: (email: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  },

  findById: (id: number): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  },

  findByResetToken: (token: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?');
    return stmt.get(token, Date.now()) as User | undefined;
  },

  findByRememberToken: (token: string): User | undefined => {
    const stmt = db.prepare('SELECT * FROM users WHERE remember_token = ?');
    return stmt.get(token) as User | undefined;
  },

  setResetToken: (userId: number, token: string, expiresIn: number = 3600000) => {
    const stmt = db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?');
    return stmt.run(token, Date.now() + expiresIn, userId);
  },

  setRememberToken: (userId: number, token: string) => {
    const stmt = db.prepare('UPDATE users SET remember_token = ? WHERE id = ?');
    return stmt.run(token, userId);
  },

  updatePassword: (userId: number, hashedPassword: string) => {
    const stmt = db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?');
    return stmt.run(hashedPassword, userId);
  },

  updatePremium: (userId: number, isPremium: boolean) => {
    const stmt = db.prepare('UPDATE users SET is_premium = ? WHERE id = ?');
    return stmt.run(isPremium ? 1 : 0, userId);
  },

  updateProfile: (userId: number, fields: { height?: number; weight?: number; gender?: string; name?: string; avatar?: string }) => {
    const updates: string[] = [];
    const params: any[] = [];
    if (fields.height !== undefined) { updates.push('height = ?'); params.push(fields.height); }
    if (fields.weight !== undefined) { updates.push('weight = ?'); params.push(fields.weight); }
    if (fields.gender !== undefined) { updates.push('gender = ?'); params.push(fields.gender); }
    if (fields.name !== undefined) { updates.push('name = ?'); params.push(fields.name); }
    if (fields.avatar !== undefined) { updates.push('avatar = ?'); params.push(fields.avatar); }

    if (updates.length === 0) return null;

    params.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    return stmt.run(...params);
  },

  addOfflineSteps: (userId: number, steps: number) => {
    const stmt = db.prepare('UPDATE users SET offline_steps = offline_steps + ?, last_sync = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(steps, userId);
  }
};
