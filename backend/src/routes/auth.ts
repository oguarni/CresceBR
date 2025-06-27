import { Router } from 'express';
import { register, login, registerValidation, loginValidation } from '../controllers/authController';

const router = Router();

// POST /auth/register
router.post('/register', registerValidation, register);

// POST /auth/login
router.post('/login', loginValidation, login);

export default router;