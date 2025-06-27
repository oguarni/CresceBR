import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  productValidation,
} from '../controllers/productsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin-only routes (protected)
router.post('/', authenticateToken, requireAdmin, productValidation, createProduct);
router.put('/:id', authenticateToken, requireAdmin, productValidation, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;