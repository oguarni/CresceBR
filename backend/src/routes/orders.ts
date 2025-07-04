import { Router } from 'express';
import { createOrderFromQuotation, getUserOrders, updateOrderStatus } from '../controllers/ordersController';
import { authenticateJWT, isSupplier } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/', createOrderFromQuotation);
router.get('/', getUserOrders);
router.put('/:orderId/status', isSupplier, updateOrderStatus);

export default router;
