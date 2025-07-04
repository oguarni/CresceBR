import { Router } from 'express';
import {
  createQuotation,
  getCustomerQuotations,
  getQuotationById,
  getAllQuotations,
  updateQuotation,
  createQuotationValidation,
  updateQuotationValidation,
  calculateQuote,
  calculateQuoteValidation,
  getQuotationCalculations,
  processQuotationWithCalculations,
} from '../controllers/quotationsController';
import { authenticateJWT, isSupplier, isAdmin } from '../middleware/auth';

const router = Router();

// All quotation routes require authentication
router.use(authenticateJWT);

// Customer routes
router.post('/', createQuotationValidation, createQuotation);
router.get('/', getCustomerQuotations);
router.get('/:id', getQuotationById);
router.get('/:id/calculations', getQuotationCalculations);

// Quote calculation routes
router.post('/calculate', calculateQuoteValidation, calculateQuote);

// Supplier routes
router.put('/supplier/:id', updateQuotationValidation, isSupplier, updateQuotation);

// Admin routes
router.get('/admin/all', isAdmin, getAllQuotations);
router.post('/admin/:id/process', isAdmin, processQuotationWithCalculations);

export default router;
