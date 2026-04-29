import { Request, Response, NextFunction } from 'express';
import { syncOfflineData } from '../services/sync.service';
import { AppError } from '../middlewares/errorHandler';
import { syncOfflineDataSchema } from '../types/sync.types';

export const handleOfflineSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body against schema
    const validatedData = syncOfflineDataSchema.parse(req.body);
    const { campaignId, donors } = validatedData;

    const result = await syncOfflineData(campaignId, donors);

    res.status(200).json({
      success: true,
      message: "تم مزامنة البيانات بنجاح",
      data: result,
      error: null
    });

  } catch (error) {
    next(error);
  }
};
