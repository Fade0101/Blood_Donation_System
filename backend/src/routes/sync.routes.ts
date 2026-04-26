// src/routes/sync.routes.ts
import { Router } from 'express';
import { handleOfflineSync } from '../controllers/sync.controller';

const router = Router();

// This maps the POST request to our controller function
router.post('/', handleOfflineSync);

export default router;