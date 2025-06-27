import { Router } from 'express';
import authRoutes from './auth';
import productsRoutes from './products';
import quotationsRoutes from './quotations';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/quotations', quotationsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CresceBR API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;