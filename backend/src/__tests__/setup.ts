import { Sequelize } from 'sequelize';

// Mock database for tests
export const mockSequelize = new Sequelize('sqlite::memory:', {
  dialect: 'sqlite',
  logging: false,
});

// Mock the database config to use our test database
jest.mock('../config/database', () => mockSequelize);

// Mock JWT token utilities
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
  generateToken: jest.fn(),
}));

// Mock external API calls
jest.mock('axios');

// Setup test database
beforeAll(async () => {
  // Initialize test database
  await mockSequelize.authenticate();
});

afterAll(async () => {
  // Clean up test database
  await mockSequelize.close();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  role: 'buyer',
  companyName: 'Test Company',
  status: 'approved',
  ...overrides,
});

global.createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  price: 100.0,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Test Category',
  supplierId: 1,
  ...overrides,
});

global.createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  companyId: 1,
  quotationId: 1,
  totalAmount: 100.0,
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

global.createMockQuotation = (overrides = {}) => ({
  id: 1,
  companyId: 1,
  status: 'processed',
  totalAmount: 100.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

declare global {
  var createMockUser: (overrides?: any) => any;
  var createMockProduct: (overrides?: any) => any;
  var createMockOrder: (overrides?: any) => any;
  var createMockQuotation: (overrides?: any) => any;
}
