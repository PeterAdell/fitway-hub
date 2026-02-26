import { Request, Response } from 'express';
import { DailySummaryModel } from '../models/DailySummary';

// NOTE: Health Connect is an Android on-device API.
// A web backend cannot directly query an Android device.
// Instead, we use the Google Fitness REST API as a proxy, assuming the user syncs Health Connect -> Google Fit.
// Alternatively, this endpoint accepts steps from the client (mobile app) and stores them.

export const getDailySteps = async (req: Request, res: Response) => {
  try {
    // Fetch from local DB (previously synced or tracked via device geolocation)
    const userId = req.user?.id;
    const today = new Date().toISOString().split('T')[0];
    
    if (userId) {
      const summary = DailySummaryModel.findByUserAndDate(userId, today);
      if (summary) {
        return res.json({ steps: summary.steps, source: 'Local Database' });
      }
    }

    return res.json({ steps: 0, message: 'No step data found for today' });
  } catch (error) {
    console.error('Get steps error:', error);
    res.status(500).json({ message: 'Error fetching steps' });
  }
};

export const syncSteps = async (req: Request, res: Response) => {
  try {
    const { steps, date } = req.body;
    const userId = req.user?.id;

    if (!userId || steps === undefined) {
      return res.status(400).json({ message: 'Steps and valid user required' });
    }

    const summaryDate = date || new Date().toISOString().split('T')[0];
    
    // Check if entry exists
    const existing = DailySummaryModel.findByUserAndDate(userId, summaryDate);
    
    if (existing) {
      // Update logic would go here (simple overwrite for now, or sum)
      // For simplicity in this demo, we acknowledge existing
      return res.json({ message: 'Steps already synced for today', summary: existing });
    }

    // Create new entry (AI analysis will be null initially)
    const summary = DailySummaryModel.create(userId, summaryDate, steps, '');
    
    res.status(201).json({ message: 'Steps synced successfully', summary });
  } catch (error) {
    console.error('Sync steps error:', error);
    res.status(500).json({ message: 'Error syncing steps' });
  }
};
