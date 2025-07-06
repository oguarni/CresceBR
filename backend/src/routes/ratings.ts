import { Router } from 'express';
import {
  createRating,
  createRatingValidation,
  getSupplierRatings,
  updateRating,
  deleteRating,
  getTopSuppliers,
  getBuyerRatings,
} from '../controllers/ratingsController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/top-suppliers', getTopSuppliers);
router.get('/supplier/:supplierId', getSupplierRatings);

// Protected routes (authenticated users only)
router.post('/', authenticateJWT, createRatingValidation, createRating);
router.get('/buyer', authenticateJWT, getBuyerRatings);
router.put('/:ratingId', authenticateJWT, updateRating);
router.delete('/:ratingId', authenticateJWT, deleteRating);

export default router;
