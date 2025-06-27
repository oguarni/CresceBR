import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import Product from '../models/Product';
import Quotation from '../models/Quotation';
import QuotationItem from '../models/QuotationItem';
import User from '../models/User';

interface CreateQuotationRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
}

export const createQuotationValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// Customer endpoints
export const createQuotation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { items }: CreateQuotationRequest = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Only customers can create quotations
  if (userRole !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Only customers can create quotations',
    });
  }

  // Validate products exist
  for (const item of items) {
    const product = await Product.findByPk(item.productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: `Product with ID ${item.productId} not found`,
      });
    }
  }

  // Create quotation
  const quotation = await Quotation.create({
    userId,
    status: 'pending',
    adminNotes: null,
  });

  // Create quotation items
  const quotationItems = await Promise.all(
    items.map(item =>
      QuotationItem.create({
        quotationId: quotation.id,
        productId: item.productId,
        quantity: item.quantity,
      })
    )
  );

  // Fetch full quotation with items and products
  const fullQuotation = await Quotation.findByPk(quotation.id, {
    include: [
      {
        model: QuotationItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Quotation created successfully',
    data: fullQuotation,
  });
});

export const getCustomerQuotations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Only customers can access their own quotations
  if (userRole !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Only customers can access quotations',
    });
  }

  const quotations = await Quotation.findAll({
    where: { userId },
    include: [
      {
        model: QuotationItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: quotations,
  });
});

export const getQuotationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const quotation = await Quotation.findByPk(id, {
    include: [
      {
        model: QuotationItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'cpf', 'address', 'role'],
      },
    ],
  });

  if (!quotation) {
    return res.status(404).json({
      success: false,
      error: 'Quotation not found',
    });
  }

  // Customers can only access their own quotations, admins can access all
  if (userRole === 'customer' && quotation.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
    });
  }

  res.status(200).json({
    success: true,
    data: quotation,
  });
});

// Admin endpoints
export const getAllQuotations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userRole = req.user!.role;

  // Only admins can access all quotations
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const quotations = await Quotation.findAll({
    include: [
      {
        model: QuotationItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'cpf', 'address', 'role'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: quotations,
  });
});

export const updateQuotationValidation = [
  body('status').isIn(['pending', 'processed', 'completed', 'rejected']).withMessage('Invalid status'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
];

export const updateQuotation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const userRole = req.user!.role;

  // Only admins can update quotations
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const quotation = await Quotation.findByPk(id);
  if (!quotation) {
    return res.status(404).json({
      success: false,
      error: 'Quotation not found',
    });
  }

  // Update quotation
  await quotation.update({
    status: status || quotation.status,
    adminNotes: adminNotes !== undefined ? adminNotes : quotation.adminNotes,
  });

  // Fetch updated quotation with all relations
  const updatedQuotation = await Quotation.findByPk(id, {
    include: [
      {
        model: QuotationItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'cpf', 'address', 'role'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    message: 'Quotation updated successfully',
    data: updatedQuotation,
  });
});