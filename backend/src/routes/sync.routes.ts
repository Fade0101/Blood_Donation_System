// src/routes/sync.routes.ts
import { Router } from 'express';
import { handleOfflineSync } from '../controllers/sync.controller';
import { validateRequest } from '../middlewares/validationMiddleware';
import { syncOfflineDataSchema } from '../types/sync.types';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

router.post(
  '/',
  validateRequest(syncOfflineDataSchema, 'body'),
  catchAsync(handleOfflineSync)
);

export default router;