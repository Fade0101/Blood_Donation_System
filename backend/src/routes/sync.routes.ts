// src/routes/sync.routes.ts
import { Router } from 'express';
import { handleOfflineSync } from '../controllers/sync.controller';
import { validateRequest } from '../middlewares/validationMiddleware';
import { syncOfflineDataSchema } from '../types/sync.types';

const router = Router();

router.post(
  '/',
  validateRequest(syncOfflineDataSchema, 'body'),
  handleOfflineSync
);

export default router;