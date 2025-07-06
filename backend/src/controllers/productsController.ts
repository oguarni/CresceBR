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

export const importProductsFromCSV = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const multer = require('multer');
    const path = require('path');
    const { CSVImporter } = require('../utils/csvImporter');

    // Configure multer for file upload
    const storage = multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        cb(null, 'uploads/');
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      },
    });

    const upload = multer({
      storage: storage,
      fileFilter: (req: any, file: any, cb: any) => {
        if (
          file.mimetype === 'text/csv' ||
          path.extname(file.originalname).toLowerCase() === '.csv'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }).single('csvFile');

    upload(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload failed',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file provided',
        });
      }

      try {
        const { skipErrors = true, batchSize = 100 } = req.body;
        const supplierId = req.user?.id!;

        const result = await CSVImporter.importProductsFromCSV(req.file.path, {
          batchSize: parseInt(batchSize) || 100,
          skipErrors: skipErrors !== 'false',
          supplierId,
        });

        // Clean up uploaded file
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
          success: result.success,
          message: `Import completed. ${result.imported} products imported, ${result.failed} failed.`,
          data: {
            imported: result.imported,
            failed: result.failed,
            errors: result.errors.slice(0, 10), // Limit errors in response
            totalErrors: result.errors.length,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Import failed',
        });
      }
    });
  }
);

export const generateSampleCSV = asyncHandler(async (req: Request, res: Response) => {
  const { CSVImporter } = require('../utils/csvImporter');
  const path = require('path');

  const sampleFilePath = path.join('uploads', `sample-products-${Date.now()}.csv`);

  try {
    CSVImporter.generateSampleCSV(sampleFilePath);

    res.download(sampleFilePath, 'sample-products.csv', err => {
      if (err) {
        console.error('Error downloading file:', err);
      }

      // Clean up the file after download
      const fs = require('fs');
      if (fs.existsSync(sampleFilePath)) {
        fs.unlinkSync(sampleFilePath);
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate sample CSV',
    });
  }
});

export const getImportStats = asyncHandler(async (req: Request, res: Response) => {
  const { CSVImporter } = require('../utils/csvImporter');

  try {
    const stats = await CSVImporter.getImportStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get import statistics',
    });
  }
});
