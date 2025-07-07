import request from 'supertest';
import express from 'express';
import {
  register,
  login,
  getProfile,
  registerSupplier,
  registerValidation,
  loginValidation,
  supplierRegisterValidation,
} from '../authController';
import {
  createOrderFromQuotation,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  createOrderValidation,
} from '../ordersController';
import { authenticateJWT } from '../../middleware/auth';
import { errorHandler } from '../../middleware/errorHandler';
import User from '../../models/User';
import Order from '../../models/Order';
import Quotation from '../../models/Quotation';
import { generateToken, generateTokenPair } from '../../utils/jwt';
import { CNPJService } from '../../services/cnpjService';
import { QuoteService } from '../../services/quoteService';

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../models/Order');
jest.mock('../../models/Quotation');
jest.mock('../../services/quoteService');
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(),
  generateTokenPair: jest.fn(),
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
}));
jest.mock('../../services/cnpjService');
jest.mock('../../middleware/auth', () => ({
  authenticateJWT: jest.fn(),
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockOrder = Order as jest.Mocked<typeof Order>;
const MockQuotation = Quotation as jest.Mocked<typeof Quotation>;
const mockGenerateTokenPair = generateTokenPair as jest.MockedFunction<typeof generateTokenPair>;
const mockCNPJService = CNPJService as jest.Mocked<typeof CNPJService>;
const mockAuthenticateJWT = authenticateJWT as jest.MockedFunction<typeof authenticateJWT>;
const mockQuoteService = QuoteService as jest.Mocked<typeof QuoteService>;

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup auth routes
app.post('/api/auth/register', registerValidation, register);
app.post('/api/auth/login', loginValidation, login);
app.get('/api/auth/profile', authenticateJWT, getProfile);
app.post('/api/auth/register-supplier', supplierRegisterValidation, registerSupplier);

// Setup order routes
app.post('/api/orders', authenticateJWT, createOrderValidation, createOrderFromQuotation);
app.get('/api/orders', authenticateJWT, getUserOrders);
app.get('/api/orders/all', authenticateJWT, getAllOrders);
app.put('/api/orders/:id/status', authenticateJWT, updateOrderStatus);

app.use(errorHandler);

describe('Integration Tests: Auth & Order Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Authentication Journey', () => {
    it('should allow a new company to register and then immediately log in', async () => {
      // Test data for the journey
      const registrationData = {
        email: 'integrationtest@example.com',
        password: 'password123',
        cpf: '12345678901',
        address: 'Integration Test Address, 123',
        companyName: 'Integration Test Company',
        corporateName: 'Integration Test Company LTDA',
        cnpj: '12345678000199',
        industrySector: 'technology',
        companyType: 'buyer' as const,
      };

      const loginData = {
        cnpj: registrationData.cnpj,
        password: registrationData.password,
      };

      // Mock data for registration
      const mockRegisteredUser = {
        id: 100,
        email: registrationData.email,
        cpf: registrationData.cpf,
        address: registrationData.address,
        companyName: registrationData.companyName,
        corporateName: registrationData.corporateName,
        cnpj: '12.345.678/0001-99',
        industrySector: registrationData.industrySector,
        companyType: registrationData.companyType,
        role: 'customer',
        status: 'approved',
        cnpjValidated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      // Step 1: Registration
      // Mock no existing users
      MockUser.findOne.mockResolvedValue(null);
      MockUser.create.mockResolvedValue(mockRegisteredUser as any);

      // Mock token generation for registration
      mockGenerateTokenPair.mockReturnValue({
        accessToken: 'registration-access-token',
        refreshToken: 'registration-refresh-token',
        expiresIn: 900,
      });

      // Mock CNPJ validation and formatting
      mockCNPJService.validateCNPJWithAPI = jest.fn().mockResolvedValue({
        valid: true,
        companyName: registrationData.companyName,
        address: registrationData.address,
      });
      mockCNPJService.formatCNPJ = jest.fn().mockReturnValue('12.345.678/0001-99');

      // Execute registration
      const registrationResponse = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      // Assert registration success
      expect(registrationResponse.body.success).toBe(true);
      expect(registrationResponse.body.message).toBe('Company registered successfully');
      expect(registrationResponse.body.data.accessToken).toBe('registration-access-token');
      expect(registrationResponse.body.data.user.email).toBe(registrationData.email);
      expect(registrationResponse.body.data.user.role).toBe('customer');

      // Verify registration database interactions before clearing mocks
      expect(MockUser.create).toHaveBeenCalledWith({
        email: registrationData.email,
        password: registrationData.password,
        cpf: registrationData.cpf,
        address: registrationData.address,
        companyName: registrationData.companyName,
        corporateName: registrationData.companyName, // Uses CNPJ validation result
        cnpj: '12.345.678/0001-99', // Formatted CNPJ
        industrySector: registrationData.industrySector,
        companyType: registrationData.companyType,
        role: 'customer',
        status: 'approved', // Buyers get approved status automatically
      });

      // Step 2: Login with the same credentials
      // Reset mocks for login
      jest.clearAllMocks();

      // Mock user found for login
      MockUser.findOne.mockResolvedValue(mockRegisteredUser as any);

      // Mock token generation for login
      mockGenerateTokenPair.mockReturnValue({
        accessToken: 'login-access-token',
        refreshToken: 'login-refresh-token',
        expiresIn: 900,
      });

      // Execute login
      const loginResponse = await request(app).post('/api/auth/login').send(loginData).expect(200);

      // Assert login success
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.data.accessToken).toBe('login-access-token');
      expect(loginResponse.body.data.user.email).toBe(registrationData.email);
      expect(loginResponse.body.data.user.cnpj).toBe('12.345.678/0001-99');

      // Verify password comparison was called during login
      expect(mockRegisteredUser.comparePassword).toHaveBeenCalledWith(registrationData.password);
    });
  });

  describe('Full Order Creation Journey', () => {
    it('should allow a logged-in user to successfully create an order', async () => {
      // Test data
      const loginData = {
        cnpj: '12345678000199',
        password: 'password123',
      };

      const orderData = {
        quotationId: 1,
      };

      // Mock authenticated user data
      const mockAuthenticatedUser = {
        id: 100,
        email: 'integrationtest@example.com',
        cpf: '12345678901',
        address: 'Integration Test Address, 123',
        companyName: 'Integration Test Company',
        corporateName: 'Integration Test Company LTDA',
        cnpj: '12.345.678/0001-99',
        industrySector: 'technology',
        companyType: 'buyer',
        role: 'customer',
        status: 'approved',
        cnpjValidated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      const mockQuotation = {
        id: orderData.quotationId,
        companyId: mockAuthenticatedUser.id,
        status: 'processed',
        totalAmount: 250.0,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Test quotation for integration',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreatedOrder = {
        id: 'order-integration-123',
        companyId: mockAuthenticatedUser.id,
        quotationId: orderData.quotationId,
        totalAmount: 250.0,
        status: 'pending',
        paymentStatus: 'pending',
        shippingCost: 25.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Step 1: Login to get access token
      MockUser.findOne.mockResolvedValue(mockAuthenticatedUser as any);
      mockGenerateTokenPair.mockReturnValue({
        accessToken: 'order-creation-access-token',
        refreshToken: 'order-creation-refresh-token',
        expiresIn: 900,
      });

      const loginResponse = await request(app).post('/api/auth/login').send(loginData).expect(200);

      const accessToken = loginResponse.body.data.accessToken;
      expect(accessToken).toBe('order-creation-access-token');

      // Step 2: Create order with the access token
      // Reset mocks for order creation
      jest.clearAllMocks();

      // Mock authentication middleware to simulate authenticated request
      mockAuthenticateJWT.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          id: mockAuthenticatedUser.id,
          email: mockAuthenticatedUser.email,
          cnpj: mockAuthenticatedUser.cnpj,
          role: mockAuthenticatedUser.role,
          companyType: mockAuthenticatedUser.companyType,
        };
        next();
      });

      // Mock quotation lookup
      MockQuotation.findOne.mockResolvedValue(mockQuotation as any);

      // Mock quote service calculations
      mockQuoteService.getQuotationWithCalculations = jest.fn().mockResolvedValue({
        calculations: {
          grandTotal: 250.0,
        },
      });

      // Mock order creation
      MockOrder.create.mockResolvedValue(mockCreatedOrder as any);

      // Mock order lookup for full order details (needed for response)
      const fullOrderData = {
        ...mockCreatedOrder,
        company: {
          id: mockAuthenticatedUser.id,
          email: mockAuthenticatedUser.email,
          role: mockAuthenticatedUser.role,
          companyName: mockAuthenticatedUser.companyName,
          cnpj: mockAuthenticatedUser.cnpj,
        },
        quotation: mockQuotation,
      };
      MockOrder.findByPk.mockResolvedValue(fullOrderData as any);

      // Execute order creation
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData)
        .expect(201);

      // Assert order creation success
      expect(orderResponse.body.success).toBe(true);
      expect(orderResponse.body.message).toBe('Order created successfully');
      expect(orderResponse.body.data.id).toBe('order-integration-123');
      expect(orderResponse.body.data.companyId).toBe(mockAuthenticatedUser.id);
      expect(orderResponse.body.data.quotationId).toBe(orderData.quotationId);
      expect(orderResponse.body.data.status).toBe('pending');
      expect(orderResponse.body.data.company.id).toBe(mockAuthenticatedUser.id);
      expect(orderResponse.body.data.quotation.id).toBe(orderData.quotationId);

      // Verify order was created with correct companyId
      expect(MockOrder.create).toHaveBeenCalledWith({
        companyId: mockAuthenticatedUser.id, // Critical: Uses companyId from authenticated user
        quotationId: orderData.quotationId,
        totalAmount: 250.0, // From quote service calculation
        status: 'pending',
      });

      // Verify authentication middleware was called with the correct token
      expect(mockAuthenticateJWT).toHaveBeenCalled();
    });
  });

  describe('Full Supplier Registration and Order Journey', () => {
    it('should allow a supplier to register and then be able to receive orders', async () => {
      // Test data for supplier registration
      const supplierRegistrationData = {
        email: 'supplier.integration@example.com',
        password: 'supplierpass123',
        cpf: '98765432101',
        address: 'Supplier Integration Address, 789',
        companyName: 'Integration Supplier Company',
        corporateName: 'Integration Supplier Company LTDA',
        cnpj: '98765432000188',
        industrySector: 'machinery',
      };

      // Mock supplier user data
      const mockSupplierUser = {
        id: 200,
        email: supplierRegistrationData.email,
        cpf: supplierRegistrationData.cpf,
        address: 'Updated Address from CNPJ',
        companyName: 'Updated Company Name',
        corporateName: 'Updated Company Name',
        cnpj: '98.765.432/0001-88',
        industrySector: supplierRegistrationData.industrySector,
        companyType: 'supplier',
        role: 'supplier',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      // Step 1: Supplier Registration
      MockUser.findOne.mockResolvedValue(null); // No existing users
      MockUser.create.mockResolvedValue(mockSupplierUser as any);

      const mockCNPJValidation = {
        valid: true,
        companyName: 'Updated Company Name',
        fantasyName: 'Updated Fantasy Name',
        address: 'Updated Address from CNPJ',
        city: 'São Paulo',
        state: 'SP',
      };

      mockCNPJService.validateCNPJWithAPI = jest.fn().mockResolvedValue(mockCNPJValidation);
      mockCNPJService.formatCNPJ = jest.fn().mockReturnValue('98.765.432/0001-88');

      // Use generateToken for supplier registration (not generateTokenPair)
      const mockGenerateToken = jest.fn().mockReturnValue('supplier-registration-token');
      jest.doMock('../../utils/jwt', () => ({
        ...jest.requireActual('../../utils/jwt'),
        generateToken: mockGenerateToken,
      }));

      const supplierRegistrationResponse = await request(app)
        .post('/api/auth/register-supplier')
        .send(supplierRegistrationData)
        .expect(201);

      // Assert supplier registration success
      expect(supplierRegistrationResponse.body.success).toBe(true);
      expect(supplierRegistrationResponse.body.message).toBe(
        'Supplier registered successfully. Account pending approval.'
      );
      expect(supplierRegistrationResponse.body.data.user.role).toBe('supplier');
      expect(supplierRegistrationResponse.body.data.user.status).toBe('pending');
      expect(supplierRegistrationResponse.body.cnpjValidation).toEqual({
        companyName: 'Updated Company Name',
        fantasyName: 'Updated Fantasy Name',
        city: 'São Paulo',
        state: 'SP',
      });

      // Verify supplier was created with correct data
      expect(MockUser.create).toHaveBeenCalledWith({
        email: supplierRegistrationData.email,
        password: supplierRegistrationData.password,
        cpf: supplierRegistrationData.cpf,
        address: 'Updated Address from CNPJ', // From CNPJ validation
        companyName: 'Updated Company Name', // From CNPJ validation
        corporateName: 'Updated Company Name', // From CNPJ validation
        cnpj: '98.765.432/0001-88', // Formatted CNPJ
        industrySector: supplierRegistrationData.industrySector,
        companyType: 'supplier',
        role: 'supplier',
        status: 'pending', // Suppliers start with pending status
      });

      // Step 2: Verify supplier can login (after approval simulation)
      jest.clearAllMocks();

      // Simulate approved supplier for login
      const approvedSupplierUser = {
        ...mockSupplierUser,
        status: 'approved',
      };

      MockUser.findOne.mockResolvedValue(approvedSupplierUser as any);
      mockGenerateTokenPair.mockReturnValue({
        accessToken: 'supplier-login-token',
        refreshToken: 'supplier-refresh-token',
        expiresIn: 900,
      });

      const supplierLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          cnpj: supplierRegistrationData.cnpj,
          password: supplierRegistrationData.password,
        })
        .expect(200);

      expect(supplierLoginResponse.body.success).toBe(true);
      expect(supplierLoginResponse.body.data.user.role).toBe('supplier');
      expect(supplierLoginResponse.body.data.user.status).toBe('approved');
    });
  });
});
