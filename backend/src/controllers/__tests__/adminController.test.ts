import request from 'supertest';
import express from 'express';
import {
  getAllPendingCompanies,
  verifyCompany,
  getAllProducts,
  moderateProduct,
  getTransactionMonitoring,
  getCompanyDetails,
  updateCompanyStatus,
} from '../adminController';
import { authenticateJWT, isAdmin } from '../../middleware/auth';
import { errorHandler } from '../../middleware/errorHandler';
import User from '../../models/User';
import Product from '../../models/Product';
import Order from '../../models/Order';
import Quotation from '../../models/Quotation';

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/Product');
jest.mock('../../models/Order');
jest.mock('../../models/Quotation');

// Mock middleware
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));
jest.mock('../../middleware/errorHandler', () => ({
  errorHandler: jest.fn((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  }),
  asyncHandler: jest.fn(
    (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next)
  ),
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockProduct = Product as jest.Mocked<typeof Product>;
const MockOrder = Order as jest.Mocked<typeof Order>;
const MockQuotation = Quotation as jest.Mocked<typeof Quotation>;

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.get('/api/admin/companies/pending', authenticateJWT, isAdmin, getAllPendingCompanies);
app.put('/api/admin/companies/:userId/verify', authenticateJWT, isAdmin, verifyCompany);
app.get('/api/admin/products', authenticateJWT, isAdmin, getAllProducts);
app.put('/api/admin/products/:productId/moderate', authenticateJWT, isAdmin, moderateProduct);
app.get('/api/admin/transactions', authenticateJWT, isAdmin, getTransactionMonitoring);
app.get('/api/admin/companies/:userId', authenticateJWT, isAdmin, getCompanyDetails);
app.put('/api/admin/companies/:userId/status', authenticateJWT, isAdmin, updateCompanyStatus);

app.use(errorHandler);

describe('Admin Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication middleware to pass
    (authenticateJWT as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { id: 1, role: 'admin', email: 'admin@test.com' };
      next();
    });

    (isAdmin as jest.Mock).mockImplementation((req, res, next) => {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      next();
    });
  });

  describe('GET /api/admin/companies/pending', () => {
    it('should return list of pending companies', async () => {
      const mockCompanies = [
        createMockUser({ id: 1, role: 'supplier', status: 'pending' }),
        createMockUser({ id: 2, role: 'supplier', status: 'pending' }),
      ];

      MockUser.findAll.mockResolvedValue(mockCompanies as any);

      const response = await request(app).get('/api/admin/companies/pending').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(MockUser.findAll).toHaveBeenCalledWith({
        where: { role: 'supplier', status: 'pending' },
      });
    });
  });

  describe('PUT /api/admin/companies/:userId/verify', () => {
    it('should successfully approve a company', async () => {
      const mockUser = createMockUser({ id: 1, role: 'supplier', status: 'pending' });
      mockUser.save = jest.fn().mockResolvedValue(mockUser);

      MockUser.findOne.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .put('/api/admin/companies/1/verify')
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should successfully reject a company', async () => {
      const mockUser = createMockUser({ id: 1, role: 'supplier', status: 'pending' });
      mockUser.save = jest.fn().mockResolvedValue(mockUser);

      MockUser.findOne.mockResolvedValue(mockUser as any);

      const response = await request(app)
        .put('/api/admin/companies/1/verify')
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 403 when user is not an admin', async () => {
      (isAdmin as jest.Mock).mockImplementation((req, res, next) => {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      });

      const response = await request(app)
        .put('/api/admin/companies/1/verify')
        .send({ status: 'approved' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should return 404 when userId does not exist', async () => {
      MockUser.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/companies/999/verify')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Supplier not found');
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
        .put('/api/admin/companies/1/verify')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid status provided');
    });

    it('should return 400 when no status is provided', async () => {
      const response = await request(app).put('/api/admin/companies/1/verify').send({}).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid status provided');
    });
  });

  describe('GET /api/admin/products', () => {
    it('should return list of all products', async () => {
      const mockProducts = [
        createMockProduct({ id: 1, name: 'Product 1' }),
        createMockProduct({ id: 2, name: 'Product 2' }),
      ];

      MockProduct.findAll.mockResolvedValue(mockProducts as any);

      const response = await request(app).get('/api/admin/products').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(MockProduct.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
      });
    });
  });

  describe('PUT /api/admin/products/:productId/moderate', () => {
    it('should approve a product', async () => {
      const mockProduct = createMockProduct({ id: 1, name: 'Test Product' });
      MockProduct.findByPk.mockResolvedValue(mockProduct as any);

      const response = await request(app)
        .put('/api/admin/products/1/moderate')
        .send({ action: 'approve' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should reject a product', async () => {
      const mockProduct = createMockProduct({ id: 1, name: 'Test Product' });
      MockProduct.findByPk.mockResolvedValue(mockProduct as any);

      const response = await request(app)
        .put('/api/admin/products/1/moderate')
        .send({ action: 'reject' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    it('should remove a product', async () => {
      const mockProduct = createMockProduct({ id: 1, name: 'Test Product' });
      mockProduct.destroy = jest.fn().mockResolvedValue(true);
      MockProduct.findByPk.mockResolvedValue(mockProduct as any);

      const response = await request(app)
        .put('/api/admin/products/1/moderate')
        .send({ action: 'remove' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product removed successfully');
      expect(mockProduct.destroy).toHaveBeenCalled();
    });

    it('should return 404 when product not found', async () => {
      MockProduct.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/products/999/moderate')
        .send({ action: 'approve' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should return 400 when action is invalid', async () => {
      const response = await request(app)
        .put('/api/admin/products/1/moderate')
        .send({ action: 'invalid_action' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid action provided');
    });
  });

  describe('GET /api/admin/transactions', () => {
    it('should return transaction monitoring data', async () => {
      const mockOrders = [
        createMockOrder({ id: 'order-1', totalAmount: 100, status: 'delivered' }),
        createMockOrder({ id: 'order-2', totalAmount: 200, status: 'processing' }),
      ];

      MockOrder.findAll.mockResolvedValue(mockOrders as any);

      const response = await request(app).get('/api/admin/transactions').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.totalRevenue).toBe(300);
      expect(response.body.data.totalOrders).toBe(2);
      expect(response.body.data.ordersByStatus).toEqual({
        delivered: 1,
        processing: 1,
      });
    });

    it('should filter by date range', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';

      MockOrder.findAll.mockResolvedValue([]);

      await request(app).get('/api/admin/transactions').query({ startDate, endDate }).expect(200);

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it('should filter by status', async () => {
      MockOrder.findAll.mockResolvedValue([]);

      await request(app).get('/api/admin/transactions').query({ status: 'delivered' }).expect(200);

      expect(MockOrder.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'delivered',
          }),
        })
      );
    });
  });

  describe('GET /api/admin/companies/:userId', () => {
    it('should return company details', async () => {
      const mockCompany = createMockUser({ id: 1, role: 'supplier' });
      MockUser.findOne.mockResolvedValue(mockCompany as any);

      const response = await request(app).get('/api/admin/companies/1').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { id: '1', role: 'supplier' },
        attributes: { exclude: ['password'] },
      });
    });

    it('should return 404 when company not found', async () => {
      MockUser.findOne.mockResolvedValue(null);

      const response = await request(app).get('/api/admin/companies/999').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Company not found');
    });
  });

  describe('PUT /api/admin/companies/:userId/status', () => {
    it('should update company status successfully', async () => {
      const mockCompany = createMockUser({ id: 1, role: 'supplier', status: 'pending' });
      mockCompany.save = jest.fn().mockResolvedValue(mockCompany);

      MockUser.findOne.mockResolvedValue(mockCompany as any);

      const response = await request(app)
        .put('/api/admin/companies/1/status')
        .send({ status: 'approved', reason: 'All documents verified' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.message).toContain('All documents verified');
      expect(mockCompany.save).toHaveBeenCalled();
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
        .put('/api/admin/companies/1/status')
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid status provided');
    });

    it('should return 404 when company not found', async () => {
      MockUser.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/admin/companies/999/status')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Company not found');
    });
  });
});
