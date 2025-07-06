import { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { Op } from 'sequelize';
import Product from '../models/Product';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom(value => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0');
      }
      return true;
    }),
  body('imageUrl').isURL().withMessage('Image URL must be a valid URL'),
  body('category').notEmpty().withMessage('Category is required'),
  body('specifications').optional().isString().withMessage('Specifications must be a string'),
  body('minimumOrderQuantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum order quantity must be at least 1'),
];

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    category,
    search,
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    minMoq,
    maxMoq,
    maxLeadTime,
    availability,
    specifications,
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};

  // Filter by category (case-insensitive for SQLite)
  if (category && typeof category === 'string') {
    where.category = {
      [Op.like]: `%${category}%`,
    };
  }

  // Search in name and description (case-insensitive for SQLite)
  if (search && typeof search === 'string') {
    where[Op.or] = [
      {
        name: {
          [Op.like]: `%${search}%`,
        },
      },
      {
        description: {
          [Op.like]: `%${search}%`,
        },
      },
      {
        category: {
          [Op.like]: `%${search}%`,
        },
      },
    ];
  }

  // Price range filter
  if (minPrice && typeof minPrice === 'string') {
    where.price = {
      ...where.price,
      [Op.gte]: parseFloat(minPrice),
    };
  }
  if (maxPrice && typeof maxPrice === 'string') {
    where.price = {
      ...where.price,
      [Op.lte]: parseFloat(maxPrice),
    };
  }

  // MOQ range filter
  if (minMoq && typeof minMoq === 'string') {
    where.minimumOrderQuantity = {
      ...where.minimumOrderQuantity,
      [Op.gte]: parseInt(minMoq),
    };
  }
  if (maxMoq && typeof maxMoq === 'string') {
    where.minimumOrderQuantity = {
      ...where.minimumOrderQuantity,
      [Op.lte]: parseInt(maxMoq),
    };
  }

  // Lead time filter
  if (maxLeadTime && typeof maxLeadTime === 'string') {
    where.leadTime = {
      [Op.lte]: parseInt(maxLeadTime),
    };
  }

  // Availability filter
  if (availability) {
    const availabilityArray = Array.isArray(availability) ? availability : [availability];
    where.availability = {
      [Op.in]: availabilityArray,
    };
  }

  // Technical specifications filter
  if (specifications && typeof specifications === 'string') {
    try {
      const specsFilter = JSON.parse(specifications);
      const specConditions = Object.entries(specsFilter).map(([key, value]) => ({
        [`specifications.${key}`]: value,
      }));

      if (specConditions.length > 0) {
        where[Op.and] = specConditions;
      }
    } catch (error) {
      console.error('Error parsing specifications filter:', error);
    }
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    },
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { name, description, price, imageUrl, category, specifications, minimumOrderQuantity } =
    req.body;
  const supplierId = req.user?.id!;

  const product = await Product.create({
    name,
    description,
    price: parseFloat(price),
    imageUrl,
    category,
    supplierId,
    specifications: specifications || null,
    unitPrice: parseFloat(price),
    minimumOrderQuantity: minimumOrderQuantity || 1,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { id } = req.params;
  const { name, description, price, imageUrl, category, specifications, minimumOrderQuantity } =
    req.body;

  const product = await Product.findByPk(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  await product.update({
    name,
    description,
    price: parseFloat(price),
    imageUrl,
    category,
    specifications: specifications !== undefined ? specifications : product.specifications,
    unitPrice: parseFloat(price),
    minimumOrderQuantity:
      minimumOrderQuantity !== undefined ? minimumOrderQuantity : product.minimumOrderQuantity,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  await product.destroy();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Product.findAll({
    attributes: ['category'],
    group: ['category'],
    order: [['category', 'ASC']],
  });

  const categoryList = categories.map(item => item.category);

  res.status(200).json({
    success: true,
    data: categoryList,
  });
});

export const getAvailableSpecifications = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.findAll({
    attributes: ['specifications'],
  });

  const allSpecs: Record<string, Set<string>> = {};

  products.forEach(product => {
    if (product.specifications && typeof product.specifications === 'object') {
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (!allSpecs[key]) {
            allSpecs[key] = new Set();
          }
          allSpecs[key].add(String(value));
        }
      });
    }
  });

  // Convert Sets to arrays for JSON serialization
  const specsWithArrays: Record<string, string[]> = {};
  Object.entries(allSpecs).forEach(([key, valueSet]) => {
    specsWithArrays[key] = Array.from(valueSet).sort();
  });

  res.status(200).json({
    success: true,
    data: specsWithArrays,
  });
});
