import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { loginValidator } from '../validators/auth.validator';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', loginValidator, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
