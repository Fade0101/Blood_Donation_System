import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { getAllUsers, getPendingUsers, approveUser, rejectUser, updateUserRole } from '../controllers/user.controller';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);

// User routes (protected) - specific routes before parameterized routes
router.get('/pending', verifyToken, requireRole(['ADMIN']), getPendingUsers); // هيبقى /api/users/pending
router.get('/', verifyToken, requireRole(['ADMIN']), getAllUsers);            // هيبقى /api/users
router.patch('/:id/approve', verifyToken, requireRole(['ADMIN']), approveUser);
router.patch('/:id/reject', verifyToken, requireRole(['ADMIN']), rejectUser);
router.patch('/:id/role', verifyToken, requireRole(['ADMIN']), updateUserRole);

export default router;
