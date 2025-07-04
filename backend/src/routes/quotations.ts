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
import { authenticateJWT, isSupplier, isAdmin } from '../middleware/auth';

const router = Router();

// All quotation routes require authentication
router.use(authenticateJWT);

// Customer routes
router.post('/', createQuotationValidation, createQuotation);
router.get('/', getCustomerQuotations);
router.get('/:id', getQuotationById);

// Supplier routes
router.put('/supplier/:id', updateQuotationValidation, isSupplier, updateQuotation);

// Admin routes
router.get('/admin/all', isAdmin, getAllQuotations);

export default router;