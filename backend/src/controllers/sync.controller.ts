// src/controllers/sync.controller.ts
import { Request, Response, NextFunction } from 'express';
import { syncOfflineData } from '../services/sync.service'; // Adjust path if needed

export const handleOfflineSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId, donors } = req.body;

    // 1. Basic Validation
    // We return Arabic error messages so the frontend can display them directly to the staff.
    if (!campaignId) {
      return res.status(400).json({ error: "معرف الحملة مطلوب" }); 
    }
    
    if (!donors || !Array.isArray(donors) || donors.length === 0) {
      return res.status(400).json({ error: "قائمة المتبرعين فارغة أو غير صالحة" });
    }

    // 2. Pass data to the Service Layer
    // The Controller doesn't care HOW the data is saved, it just delegates the job.
    const result = await syncOfflineData(campaignId, donors);

    // 3. Send Success Response
    res.status(200).json(result);

  } catch (error) {
    // 4. Error Handling
    // If anything fails in the service (like a database crash), we pass it to the global error handler
    next(error);
  }
};