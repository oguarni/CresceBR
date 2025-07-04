import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import Rating from '../models/Rating';
import Order from '../models/Order';
import User from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import { Op, Sequelize } from 'sequelize';

export const createRatingValidation = [
  body('supplierId').isInt({ min: 1 }).withMessage('Valid supplier ID is required'),
  body('orderId').optional().isUUID().withMessage('Order ID must be a valid UUID'),
  body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
];

export const createRating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }

  const { supplierId, orderId, score, comment } = req.body;
  const buyerId = req.user?.id!;

  // Check if supplier exists
  const supplier = await User.findOne({
    where: { id: supplierId, role: 'supplier' },
  });

  if (!supplier) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found',
    });
  }

  // If orderId is provided, verify the buyer has a completed order from this supplier
  if (orderId) {
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: buyerId,
        status: 'delivered',
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { id: buyerId },
        },
      ],
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        error: 'You can only rate suppliers from completed orders',
      });
    }

    // Check if rating already exists for this order
    const existingRating = await Rating.findOne({
      where: { orderId, buyerId },
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this order',
      });
    }
  } else {
    // If no orderId, check if buyer has any completed orders from this supplier
    const completedOrder = await Order.findOne({
      where: {
        userId: buyerId,
        status: 'delivered',
      },
      include: [
        {
          model: User,
          as: 'supplier',
          where: { id: supplierId },
        },
      ],
    });

    if (!completedOrder) {
      return res.status(403).json({
        success: false,
        error: 'You can only rate suppliers from completed orders',
      });
    }
  }

  try {
    const rating = await Rating.create({
      supplierId,
      buyerId,
      orderId: orderId || null,
      score,
      comment: comment || null,
    });

    const fullRating = await Rating.findByPk(rating.id, {
      include: [
        {
          model: User,
          as: 'supplier',
          attributes: ['id', 'companyName', 'email'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'companyName', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      data: fullRating,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rating',
    });
  }
});

export const getSupplierRatings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { supplierId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: ratings } = await Rating.findAndCountAll({
    where: { supplierId },
    include: [
      {
        model: User,
        as: 'buyer',
        attributes: ['id', 'companyName'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  // Calculate average rating
  const averageScore =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
      : 0;

  // Calculate score distribution
  const scoreDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  ratings.forEach(rating => {
    scoreDistribution[rating.score as keyof typeof scoreDistribution]++;
  });

  res.status(200).json({
    success: true,
    data: {
      ratings,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
      averageScore: parseFloat(averageScore.toFixed(2)),
      totalRatings: count,
      scoreDistribution,
    },
  });
});

export const updateRating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ratingId } = req.params;
  const { score, comment } = req.body;
  const buyerId = req.user?.id!;

  const rating = await Rating.findOne({
    where: { id: ratingId, buyerId },
  });

  if (!rating) {
    return res.status(404).json({
      success: false,
      error: 'Rating not found or you do not have permission to edit it',
    });
  }

  // Check if the rating is recent (within 24 hours)
  const ratingAge = Date.now() - rating.createdAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (ratingAge > twentyFourHours) {
    return res.status(400).json({
      success: false,
      error: 'Ratings can only be edited within 24 hours of creation',
    });
  }

  try {
    await rating.update({
      score: score || rating.score,
      comment: comment !== undefined ? comment : rating.comment,
    });

    const updatedRating = await Rating.findByPk(rating.id, {
      include: [
        {
          model: User,
          as: 'supplier',
          attributes: ['id', 'companyName', 'email'],
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'companyName', 'email'],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: updatedRating,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rating',
    });
  }
});

export const deleteRating = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { ratingId } = req.params;
  const buyerId = req.user?.id!;
  const userRole = req.user?.role;

  const whereClause: any = { id: ratingId };

  // Only allow buyers to delete their own ratings, or admins to delete any rating
  if (userRole !== 'admin') {
    whereClause.buyerId = buyerId;
  }

  const rating = await Rating.findOne({ where: whereClause });

  if (!rating) {
    return res.status(404).json({
      success: false,
      error: 'Rating not found or you do not have permission to delete it',
    });
  }

  try {
    await rating.destroy();

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete rating',
    });
  }
});

export const getTopSuppliers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { limit = 10 } = req.query;

  const topSuppliers = await User.findAll({
    where: { role: 'supplier', status: 'approved' },
    attributes: [
      'id',
      'companyName',
      'email',
      [Sequelize.fn('AVG', Sequelize.col('supplierRatings.score')), 'averageRating'],
      [Sequelize.fn('COUNT', Sequelize.col('supplierRatings.id')), 'totalRatings'],
    ],
    include: [
      {
        model: Rating,
        as: 'supplierRatings',
        attributes: [],
      },
    ],
    group: ['User.id'],
    having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col('supplierRatings.id')), Op.gte, 3),
    order: [
      [Sequelize.fn('AVG', Sequelize.col('supplierRatings.score')), 'DESC'],
      [Sequelize.fn('COUNT', Sequelize.col('supplierRatings.id')), 'DESC'],
    ],
    limit: Number(limit),
    subQuery: false,
    raw: true,
  });

  // Transform the results to match the expected format
  const qualifiedSuppliers = topSuppliers.map(supplier => ({
    id: supplier.id,
    companyName: supplier.companyName,
    email: supplier.email,
    averageRating: parseFloat(Number(supplier.averageRating).toFixed(2)),
    totalRatings: supplier.totalRatings ? Number(supplier.totalRatings) : 0,
  }));

  res.status(200).json({
    success: true,
    data: qualifiedSuppliers,
  });
});

export const getBuyerRatings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const buyerId = req.user?.id!;
  const { page = 1, limit = 10 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: ratings } = await Rating.findAndCountAll({
    where: { buyerId },
    include: [
      {
        model: User,
        as: 'supplier',
        attributes: ['id', 'companyName'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  res.status(200).json({
    success: true,
    data: {
      ratings,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    },
  });
});
