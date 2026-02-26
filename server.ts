import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './server/routes/authRoutes';
import healthRoutes from './server/routes/healthRoutes';
import aiRoutes from './server/routes/aiRoutes';
import chatRoutes from './server/routes/chatRoutes';
import communityRoutes from './server/routes/communityRoutes';
import stepsRoutes from './server/routes/stepsRoutes';
import trackRoutes from './server/routes/trackRoutes';
import analyticsRoutes from './server/routes/analyticsRoutes';
import coachingRoutes from './server/routes/coachingRoutes';
import userRoutes from './server/routes/userRoutes';
import workoutsRoutes from './server/routes/workoutsRoutes';
import { errorHandler } from './server/middleware/error';

async function startServer() {
  // Initialize Express app
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for dev to avoid Vite issues
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow loading images from uploads
  })); 
  app.use(cors()); // Enable CORS
  app.use(morgan('dev')); // Logger
  app.use(express.json()); // Parse JSON bodies
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads

  // API Routes
  console.log('Registering API routes...');
  app.use('/api/auth', (req, res, next) => {
    console.log(`Auth request: ${req.method} ${req.url}`);
    next();
  }, authRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api/steps', stepsRoutes);
  // Google Fit integration removed — keep auth and health endpoints simple
  app.use('/api/ai', aiRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/community', communityRoutes);
  app.use('/api/track', trackRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/coaching', coachingRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/workouts', workoutsRoutes);
  console.log('API routes registered');

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files (for React frontend) in production
    app.use(express.static(path.join(__dirname, 'dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Error handling middleware
  app.use(errorHandler);

  // Start server
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Public IP: Use your machine's IP address :${PORT} to access from other devices`);
  });
}

startServer();

export default startServer;
