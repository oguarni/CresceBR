// The database is automatically mocked by Jest using __mocks__/database.ts
// This setup file focuses on controlling mock behavior and providing test utilities

// Mock all Sequelize models
jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/Order', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/Quotation', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/Product', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/QuotationItem', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/Rating', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

jest.mock('../models/OrderStatusHistory', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    init: jest.fn(),
    associate: jest.fn(),
  },
}));

// Mock JWT token utilities
jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn(),
  generateToken: jest.fn(),
  generateTokenPair: jest.fn(),
  refreshAccessToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
}));

// Mock services
jest.mock('../services/orderStatusService');
jest.mock('../services/quoteService');
jest.mock('../services/cnpjService');

// Mock external API calls
jest.mock('axios');

// Setup test database (now globally mocked via moduleNameMapper)
beforeAll(async () => {
  // Test environment setup - database is mocked globally
});

afterAll(async () => {
  // Test environment cleanup
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock data creation functions for new User/Company model
export const createMockCompany = (overrides = {}) => ({
  id: 1,
  name: 'Test Company',
  corporateName: 'Test Company LTDA',
  cnpj: '12.345.678/0001-90',
  cnpjValidated: true,
  industrySector: 'technology',
  companyType: 'buyer',
  status: 'approved',
  address: 'Test Address, 123',
  street: 'Test Street',
  number: '123',
  complement: 'Suite 1',
  neighborhood: 'Test Neighborhood',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  country: 'Brazil',
  phone: '+55 11 99999-9999',
  contactPerson: 'Test Contact',
  contactTitle: 'Manager',
  companySize: 'medium',
  annualRevenue: '2m_10m',
  certifications: ['ISO 9001'],
  website: 'https://testcompany.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  cpf: '123.456.789-01',
  role: 'customer',
  companyId: 1,
  status: 'approved',
  createdAt: new Date(),
  updatedAt: new Date(),
  comparePassword: jest.fn().mockResolvedValue(true),
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  description: 'Test Description',
  price: 100.0,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Test Category',
  companyId: 1, // Now uses companyId instead of supplierId
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  companyId: 1, // Required field
  quotationId: 1,
  totalAmount: 100.0,
  status: 'pending',
  shippingAddress: 'Test Shipping Address',
  paymentMethod: 'credit_card',
  paymentStatus: 'pending',
  shippingCost: 15.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockQuotation = (overrides = {}) => ({
  id: 1,
  companyId: 1, // Required field
  status: 'processed',
  totalAmount: 100.0,
  validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  notes: 'Test quotation notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockQuotationItem = (overrides = {}) => ({
  id: 1,
  quotationId: 1,
  productId: 1,
  quantity: 2,
  unitPrice: 50.0,
  totalPrice: 100.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockRating = (overrides = {}) => ({
  id: 1,
  orderId: 'order-123',
  companyId: 1,
  productId: 1,
  rating: 5,
  comment: 'Excellent product!',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Add mock functions to global scope for backward compatibility
(global as any).createMockCompany = createMockCompany;
(global as any).createMockUser = createMockUser;
(global as any).createMockProduct = createMockProduct;
(global as any).createMockOrder = createMockOrder;
(global as any).createMockQuotation = createMockQuotation;
(global as any).createMockQuotationItem = createMockQuotationItem;
(global as any).createMockRating = createMockRating;
