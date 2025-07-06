import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getAvailableSpecifications,
  productValidation,
} from '../controllers/productsController';
import { authenticateJWT, isSupplier, isAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/specifications', getAvailableSpecifications);
router.get('/:id', getProductById);

// Supplier-only routes (protected)
router.post('/', authenticateJWT, isSupplier, productValidation, createProduct);
router.put('/:id', authenticateJWT, isSupplier, productValidation, updateProduct);

// Admin-only routes (protected)
router.delete('/:id', authenticateJWT, isAdmin, deleteProduct);

export default router;
