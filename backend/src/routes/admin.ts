import { Router } from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import {
  getAllPendingCompanies,
  verifyCompany,
  getAllProducts,
  moderateProduct,
  getTransactionMonitoring,
  getCompanyDetails,
  updateCompanyStatus,
  validateSupplierCNPJ,
  getSupplierMetrics,
  getVerificationQueue,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT, isAdmin);

// Example admin route
router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'Welcome to the admin dashboard' });
});

// Company verification and management
router.get('/companies/pending', getAllPendingCompanies);
router.get('/companies/queue', getVerificationQueue);
router.put('/companies/:userId/verify', verifyCompany);
router.get('/companies/:userId', getCompanyDetails);
router.put('/companies/:userId/status', updateCompanyStatus);
router.post('/companies/:userId/validate-cnpj', validateSupplierCNPJ);
router.get('/companies/:userId/metrics', getSupplierMetrics);

// Product management
router.get('/products', getAllProducts);
router.put('/products/:productId/moderate', moderateProduct);

// Transaction monitoring
router.get('/transactions', getTransactionMonitoring);

export default router;
