import { Router } from 'express';
import {
  register,
  login,
  loginWithEmail,
  getProfile,
  registerSupplier,
  registerValidation,
  loginValidation,
  loginEmailValidation,
  supplierRegisterValidation,
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// POST /auth/register
router.post('/register', registerValidation, register);

// POST /auth/register-supplier
router.post('/register-supplier', supplierRegisterValidation, registerSupplier);

// POST /auth/login (CNPJ-based)
router.post('/login', loginValidation, login);

// POST /auth/login-email (Email-based for backward compatibility)
router.post('/login-email', loginEmailValidation, loginWithEmail);

// GET /auth/me
router.get('/me', authenticateJWT, getProfile);

export default router;
