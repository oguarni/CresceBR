import { Router } from 'express';
import {
  createQuotation,
  getCustomerQuotations,
  getQuotationById,
  getAllQuotations,
  updateQuotation,
  createQuotationValidation,
  updateQuotationValidation,
} from '../controllers/quotationsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All quotation routes require authentication
router.use(authenticateToken);

// Customer routes
router.post('/', createQuotationValidation, createQuotation);
router.get('/', getCustomerQuotations);
router.get('/:id', getQuotationById);

// Admin routes
router.get('/admin/all', getAllQuotations);
router.put('/admin/:id', updateQuotationValidation, updateQuotation);

export default router;