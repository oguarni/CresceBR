import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6, max: 255 })
    .withMessage('Password must be between 6-255 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase, uppercase, and number'),
  body('cpf')
    .matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage('Valid CPF format required'),
  body('address')
    .isLength({ min: 10, max: 500 })
    .trim()
    .escape()
    .withMessage('Address must be between 10-500 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'supplier'])
    .withMessage('Role must be customer or supplier'),
  body('companyName')
    .optional()
    .isLength({ min: 2, max: 255 })
    .trim()
    .escape()
    .withMessage('Company name must be between 2-255 characters'),
  body('corporateName')
    .optional()
    .isLength({ min: 2, max: 255 })
    .trim()
    .escape()
    .withMessage('Corporate name must be between 2-255 characters'),
  body('cnpj')
    .optional()
    .matches(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('Valid CNPJ format required'),
  body('industrySector')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Industry sector must be between 2-100 characters'),
  handleValidationErrors,
];

export const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
  handleValidationErrors,
];

// Product validation rules
export const validateProductCreation = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .trim()
    .escape()
    .withMessage('Product name must be between 1-255 characters'),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .trim()
    .escape()
    .withMessage('Description must be between 10-2000 characters'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
  body('imageUrl').isURL().withMessage('Valid image URL is required'),
  body('category')
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Category must be between 1-100 characters'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Unit price must be a positive number'),
  body('minimumOrderQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum order quantity must be a positive integer'),
  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be a valid JSON object'),
  body('tierPricing').optional().isArray().withMessage('Tier pricing must be an array'),
  body('tierPricing.*.minQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum quantity must be a positive integer'),
  body('tierPricing.*.maxQuantity')
    .optional()
    .custom(value => value === null || (Number.isInteger(value) && value > 0))
    .withMessage('Maximum quantity must be null or a positive integer'),
  body('tierPricing.*.discount')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Discount must be between 0 and 1'),
  handleValidationErrors,
];

export const validateProductUpdate = [
  param('id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('name').optional().isLength({ min: 1, max: 255 }).trim().escape(),
  body('description').optional().isLength({ min: 10, max: 2000 }).trim().escape(),
  body('price').optional().isFloat({ min: 0.01 }),
  body('imageUrl').optional().isURL(),
  body('category').optional().isLength({ min: 1, max: 100 }).trim().escape(),
  body('unitPrice').optional().isFloat({ min: 0.01 }),
  body('minimumOrderQuantity').optional().isInt({ min: 1 }),
  body('specifications').optional().isObject(),
  body('tierPricing').optional().isArray(),
  handleValidationErrors,
];

// Quotation validation rules
export const validateQuotationCreation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer for each item'),
  handleValidationErrors,
];

// Order validation rules
export const validateOrderCreation = [
  body('quotationId').isInt({ min: 1 }).withMessage('Valid quotation ID is required'),
  body('shippingAddress')
    .optional()
    .isLength({ min: 10, max: 500 })
    .trim()
    .escape()
    .withMessage('Shipping address must be between 10-500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .escape()
    .withMessage('Notes must be less than 1000 characters'),
  handleValidationErrors,
];

export const validateOrderUpdate = [
  param('id').isUUID().withMessage('Valid order ID is required'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('trackingNumber')
    .optional()
    .isLength({ min: 5, max: 100 })
    .trim()
    .escape()
    .withMessage('Tracking number must be between 5-100 characters'),
  body('estimatedDeliveryDate').optional().isISO8601().withMessage('Valid date is required'),
  body('notes').optional().isLength({ max: 1000 }).trim().escape(),
  handleValidationErrors,
];

// Rating validation rules
export const validateRatingCreation = [
  body('supplierId').isInt({ min: 1 }).withMessage('Valid supplier ID is required'),
  body('orderId').optional().isUUID().withMessage('Valid order ID format required'),
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .trim()
    .escape()
    .withMessage('Comment must be less than 1000 characters'),
  handleValidationErrors,
];

// Query parameter validation
export const validatePaginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

export const validateSearchQuery = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 255 })
    .trim()
    .escape()
    .withMessage('Search query must be between 1-255 characters'),
  query('category')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .escape()
    .withMessage('Category must be between 1-100 characters'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'category'])
    .withMessage('Sort field must be one of: name, price, createdAt, category'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

// ID parameter validation
export const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
  handleValidationErrors,
];

export const validateUUIDParam = [
  param('id').isUUID().withMessage('Valid UUID is required'),
  handleValidationErrors,
];

// Admin validation rules
export const validateCompanyVerification = [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .trim()
    .escape()
    .withMessage('Reason must be less than 500 characters'),
  body('validateCNPJ').optional().isBoolean().withMessage('ValidateCNPJ must be a boolean'),
  handleValidationErrors,
];

export const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  handleValidationErrors,
];

// CNPJ validation
export const validateCNPJ = [
  body('cnpj')
    .matches(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('Valid CNPJ format required'),
  handleValidationErrors,
];

// File upload validation
export const validateFileUpload = (
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'File is required',
      });
    }

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Check file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 5MB',
      });
    }

    next();
  };
};

// Quote calculation validation
export const validateQuoteCalculation = [
  body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('buyerLocation')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Buyer location must be between 2-100 characters'),
  body('supplierLocation')
    .optional()
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Supplier location must be between 2-100 characters'),
  body('shippingMethod')
    .optional()
    .isIn(['standard', 'express', 'economy'])
    .withMessage('Shipping method must be standard, express, or economy'),
  handleValidationErrors,
];
