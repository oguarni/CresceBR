import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /auth/register
router.post('/register', registerValidation, register);

// POST /auth/login
router.post('/login', loginValidation, login);

// GET /auth/me
router.get('/me', authenticateToken, getProfile);

export default router;
