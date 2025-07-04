import { Router } from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { getAllPendingCompanies, verifyCompany } from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT, isAdmin);

// Example admin route
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Welcome to the admin dashboard' });
});

router.get('/companies/pending', getAllPendingCompanies);
router.put('/companies/:userId/verify', verifyCompany);

export default router;