import { body } from 'express-validator';

export const createOrderValidation = [
  body('quotationId').isInt({ min: 1 }).withMessage('Valid quotation ID is required'),
];

export const updateOrderStatusValidation = [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('trackingNumber').optional().isString().withMessage('Tracking number must be a string'),
  body('estimatedDeliveryDate').optional().isISO8601().withMessage('Invalid date format'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
];
