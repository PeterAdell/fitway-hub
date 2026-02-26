import { Request, Response } from 'express';

export const bookSession = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || null;
    const { coachId, time } = req.body;
    if (!coachId || !time) return res.status(400).json({ message: 'coachId and time required' });

    // In a real app persist booking to DB
    const bookingId = `bk_${Date.now()}`;

    console.log(`User ${userId} booked coach ${coachId} at ${time} -> ${bookingId}`);

    return res.json({ success: true, bookingId, coachId, time });
  } catch (err) {
    console.error('Booking error', err);
    return res.status(500).json({ message: 'Booking failed' });
  }
};
