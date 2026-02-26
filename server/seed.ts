import db from './config/database';
import bcrypt from 'bcryptjs';

const seed = async () => {
  console.log('Seeding database...');
  
  // Clear existing data (optional, but good for clean slate)
  db.exec('DELETE FROM challenge_participants');
  db.exec('DELETE FROM challenges');
  db.exec('DELETE FROM posts');
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM daily_summaries');
  db.exec('DELETE FROM steps_entries');
  db.exec('DELETE FROM premium_sessions');
  db.exec('DELETE FROM users');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Create Test User
  const testStmt = db.prepare(`
    INSERT INTO users (name, email, password, role, avatar, is_premium, points, steps, height, weight, gender)
    VALUES (?, ?, ?, 'user', ?, 1, 1000, 8540, 175, 75, 'male')
  `);
  const testInfo = testStmt.run(
    'Test User',
    'test@example.com',
    passwordHash,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
  );
  const testUserId = testInfo.lastInsertRowid;
  console.log('✅ Created test user: test@example.com / password123');

  // Create Coaches
  const coaches = [];
  for (let i = 1; i <= 20; i++) {
    const name = `Coach ${i}`;
    const email = `coach${i}@fitway.com`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=Coach${i}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, avatar, is_premium, points, steps, height, weight, gender)
      VALUES (?, ?, ?, 'coach', ?, 1, 500, 10000, 180, 80, 'male')
    `);
    const info = stmt.run(name, email, passwordHash, avatar);
    coaches.push(info.lastInsertRowid);
  }
  console.log('✅ Created 20 coaches (all premium)');

  // Create Users (all premium)
  const users = [testUserId]; // Start with test user
  for (let i = 1; i <= 20; i++) {
    const name = `User ${i}`;
    const email = `user${i}@example.com`;
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`;
    
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role, avatar, is_premium, points, steps, height, weight, gender)
      VALUES (?, ?, ?, 'user', ?, 1, 500, 5000, 170, 70, 'female')
    `);
    const info = stmt.run(name, email, passwordHash, avatar);
    users.push(info.lastInsertRowid);
  }
  console.log('✅ Created 20 users (all premium)');

  // Create some steps entries for test user
  const stepsStmt = db.prepare(`
    INSERT INTO steps_entries (user_id, date, steps, calories_burned, distance_km, tracking_mode)
    VALUES (?, ?, ?, ?, ?, 'manual')
  `);
  const today = new Date().toISOString().split('T')[0];
  stepsStmt.run(testUserId, today, 8540, 412, 6.28);
  console.log('✅ Added steps entry for test user');

  // Create some initial posts
  const postStmt = db.prepare(`
    INSERT INTO posts (user_id, content, hashtags, likes)
    VALUES (?, ?, ?, ?)
  `);
  
  for (const userId of users) {
    postStmt.run(userId, `Just finished a great workout! Feeling pumped!`, '#fitness #workout', Math.floor(Math.random() * 50));
  }
  console.log('✅ Created initial posts');

  // Create a challenge
  const challengeStmt = db.prepare(`
    INSERT INTO challenges (creator_id, title, description, start_date, end_date, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const challengeId = challengeStmt.run(
    coaches[0], 
    '30 Day Summer Shred', 
    'Get ready for summer with this intense 30-day challenge!', 
    new Date().toISOString(), 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80'
  ).lastInsertRowid;

  // Add participants
  const participantStmt = db.prepare('INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)');
  for (const userId of users.slice(0, 10)) {
    participantStmt.run(challengeId, userId);
  }
  console.log('✅ Created challenge and participants');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📝 Test Account Credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
  console.log('   Status: Premium (No payment required)');
};

seed().catch(console.error);
