import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Order from '../models/Order';
import Quotation from '../models/Quotation';
import { asyncHandler } from '../middleware/errorHandler';

export const createOrderFromQuotation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { quotationId } = req.body;
  const userId = req.user?.id;

  if (!quotationId) {
    return res.status(400).json({ success: false, error: 'Quotation ID is required' });
  }

  const quotation = await Quotation.findOne({ where: { id: quotationId, userId } });

  if (!quotation) {
    return res.status(404).json({ success: false, error: 'Quotation not found or does not belong to the user' });
  }

  if (quotation.status !== 'completed') {
    return res.status(400).json({ success: false, error: 'Only completed quotations can be converted to orders' });
  }

  // This is a placeholder for the total amount. In a real application, you would calculate this based on the quotation items.
  const totalAmount = 1000;

  const order = await Order.create({
    userId: userId!,
    quotationId,
    totalAmount,
  });

  res.status(201).json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.status = status;
  await order.save();

  res.status(200).json({ success: true, data: order });
});

export const getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const orders = await Order.findAll({ where: { userId } });
  res.status(200).json({ success: true, data: orders });
});
