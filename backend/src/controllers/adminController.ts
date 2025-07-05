import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import Quotation from '../models/Quotation';
import { asyncHandler } from '../middleware/errorHandler';
import { CNPJService } from '../services/cnpjService';

export const getAllPendingCompanies = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const companies = await User.findAll({
      where: {
        role: 'supplier',
        status: 'pending',
      },
    });
    res.status(200).json({ success: true, data: companies });
  }
);

export const verifyCompany = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { status, reason, validateCNPJ = true } = req.body;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status provided' });
  }

  const user = await User.findOne({ where: { id: userId, role: 'supplier' } });

  if (!user) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }

  // If approving and CNPJ validation is requested
  if (status === 'approved' && validateCNPJ && user.cnpj) {
    try {
      const cnpjValidation = await CNPJService.validateAndUpdateCompany(user.cnpj, user.id);

      if (!cnpjValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'CNPJ validation failed',
          details: cnpjValidation.error,
        });
      }

      // Refresh user data after CNPJ update
      await user.reload();
    } catch (error) {
      console.error('CNPJ validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate CNPJ',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: `Company ${status} successfully${reason ? ` - ${reason}` : ''}`,
  });
});

export const getAllProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const products = await Product.findAll({
    order: [['createdAt', 'DESC']],
  });
  res.status(200).json({ success: true, data: products });
});

export const moderateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const { action } = req.body;

  if (!action || !['approve', 'reject', 'remove'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action provided' });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  if (action === 'remove') {
    await product.destroy();
    return res.status(200).json({ success: true, message: 'Product removed successfully' });
  }

  res.status(200).json({ success: true, data: product });
});

export const getTransactionMonitoring = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, status } = req.query;

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [
          new Date(startDate as string),
          new Date(endDate as string),
        ],
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'companyName', 'role'],
        },
        {
          model: Quotation,
          as: 'quotation',
          attributes: ['id', 'totalAmount', 'status'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount.toString()),
      0
    );
    const ordersByStatus = orders.reduce((acc: any, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        orders,
        totalRevenue,
        ordersByStatus,
        totalOrders: orders.length,
      },
    });
  }
);

export const getCompanyDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  const company = await User.findOne({
    where: { id: userId, role: 'supplier' },
    attributes: { exclude: ['password'] },
  });

  if (!company) {
    return res.status(404).json({ success: false, error: 'Company not found' });
  }

  res.status(200).json({ success: true, data: company });
});

export const updateCompanyStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!status || !['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status provided' });
    }

    const company = await User.findOne({ where: { id: userId, role: 'supplier' } });
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    company.status = status;
    await company.save();

    res.status(200).json({
      success: true,
      data: company,
      message: `Company status updated to ${status}${reason ? ` - ${reason}` : ''}`,
    });
  }
);

export const validateSupplierCNPJ = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;

    const user = await User.findOne({ where: { id: userId, role: 'supplier' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }

    if (!user.cnpj) {
      return res.status(400).json({ success: false, error: 'Supplier has no CNPJ to validate' });
    }

    try {
      const cnpjValidation = await CNPJService.validateAndUpdateCompany(user.cnpj, user.id);

      await user.reload();

      res.status(200).json({
        success: true,
        data: {
          user,
          cnpjValidation,
        },
      });
    } catch (error) {
      console.error('CNPJ validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate CNPJ',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export const getSupplierMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  const user = await User.findOne({
    where: { id: userId, role: 'supplier' },
    attributes: { exclude: ['password'] },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }

  // Get supplier's products
  const products = await Product.findAll({
    where: { supplierId: userId },
    attributes: ['id', 'name', 'price', 'category', 'createdAt'],
  });

  // Get orders related to this supplier's products
  const { Op } = require('sequelize');
  const orders = await Order.findAll({
    include: [
      {
        model: Quotation,
        as: 'quotation',
        include: [
          {
            model: require('../models/QuotationItem').default,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                where: { supplierId: userId },
              },
            ],
          },
        ],
      },
    ],
  });

  // Get ratings for this supplier
  const Rating = (await import('../models/Rating')).default;
  const ratings = await Rating.findAll({
    where: { supplierId: userId },
    attributes: ['score', 'comment', 'createdAt'],
    include: [
      {
        model: User,
        as: 'buyer',
        attributes: ['companyName', 'email'],
      },
    ],
  });

  // Calculate metrics
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount.toString()),
    0
  );

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
      : 0;

  const ordersByStatus = orders.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const recentRatings = ratings
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  res.status(200).json({
    success: true,
    data: {
      supplier: user,
      metrics: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalRatings: ratings.length,
        ordersByStatus,
        cnpjValidated: user.cnpjValidated,
        industrySector: user.industrySector,
      },
      products: products.slice(0, 10), // Limit to first 10 products
      recentRatings,
    },
  });
});

export const getVerificationQueue = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { role: 'supplier' };

    if (filter === 'pending') {
      whereClause.status = 'pending';
    } else if (filter === 'unvalidated_cnpj') {
      whereClause.cnpjValidated = false;
      whereClause.cnpj = { [require('sequelize').Op.ne]: null };
    }

    const companies = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: {
        companies: companies.rows,
        totalCount: companies.count,
        currentPage: Number(page),
        totalPages: Math.ceil(companies.count / Number(limit)),
      },
    });
  }
);
