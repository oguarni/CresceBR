import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  registerSupplier,
  registerValidation,
  loginValidation,
  supplierRegisterValidation,
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// POST /auth/register
router.post('/register', registerValidation, register);

// POST /auth/register-supplier
router.post('/register-supplier', supplierRegisterValidation, registerSupplier);

// POST /auth/login
router.post('/login', loginValidation, login);

// GET /auth/me
router.get('/me', authenticateJWT, getProfile);

export default router;
