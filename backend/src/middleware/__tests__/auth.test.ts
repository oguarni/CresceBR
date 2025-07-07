import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, isAdmin, isSupplier, AuthenticatedRequest } from '../auth';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import { AuthTokenPayload } from '../../types';

// Mock JWT utilities
jest.mock('../../utils/jwt');
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockExtractTokenFromHeader = extractTokenFromHeader as jest.MockedFunction<
  typeof extractTokenFromHeader
>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticateJWT', () => {
    it('should authenticate user with valid token successfully', () => {
      // Arrange
      const mockToken = 'valid-jwt-token';
      const mockPayload: AuthTokenPayload = {
        id: 1,
        email: 'test@example.com',
        role: 'customer',
        cnpj: '12345678000191',
        companyType: 'buyer',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(mockPayload);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${mockToken}`);
      expect(mockVerifyToken).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header is provided', () => {
      // Arrange
      mockRequest.headers = {}; // No authorization header
      mockExtractTokenFromHeader.mockReturnValue(null);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith(undefined);
      expect(mockVerifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should return 401 when authorization header is malformed', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
      };
      mockExtractTokenFromHeader.mockReturnValue(null);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith('InvalidFormat token123');
      expect(mockVerifyToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer header has no token', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer ',
      };
      mockExtractTokenFromHeader.mockReturnValue(null);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith('Bearer ');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required',
      });
    });

    it('should return 403 when token is invalid', () => {
      // Arrange
      const invalidToken = 'invalid-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(invalidToken);
      mockVerifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockExtractTokenFromHeader).toHaveBeenCalledWith(`Bearer ${invalidToken}`);
      expect(mockVerifyToken).toHaveBeenCalledWith(invalidToken);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
    });

    it('should return 403 when token is expired', () => {
      // Arrange
      const expiredToken = 'expired-jwt-token';
      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(expiredToken);
      mockVerifyToken.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyToken).toHaveBeenCalledWith(expiredToken);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate admin user successfully', () => {
      // Arrange
      const mockToken = 'admin-jwt-token';
      const adminPayload: AuthTokenPayload = {
        id: 2,
        email: 'admin@example.com',
        role: 'admin',
        cnpj: '12345678000192',
        companyType: 'both',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(adminPayload);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual(adminPayload);
      expect(mockRequest.user?.role).toBe('admin');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate supplier user successfully', () => {
      // Arrange
      const mockToken = 'supplier-jwt-token';
      const supplierPayload: AuthTokenPayload = {
        id: 3,
        email: 'supplier@example.com',
        role: 'supplier',
        cnpj: '12345678000193',
        companyType: 'supplier',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(supplierPayload);

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockRequest.user).toEqual(supplierPayload);
      expect(mockRequest.user?.role).toBe('supplier');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token verification throwing non-Error objects', () => {
      // Arrange
      const mockToken = 'problematic-token';
      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });

      // Act
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
      });
    });

    it('should handle case-sensitive authorization header', () => {
      // Arrange
      const mockToken = 'case-test-token';

      // Test different case variations
      const testHeaders = [
        { Authorization: `Bearer ${mockToken}` }, // Capital A
        { AUTHORIZATION: `Bearer ${mockToken}` }, // All caps
      ];

      testHeaders.forEach((headers, index) => {
        jest.clearAllMocks();
        mockRequest.headers = headers;
        mockExtractTokenFromHeader.mockReturnValue(null); // Headers are case-sensitive in Express

        authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
      });
    });
  });

  describe('isAdmin', () => {
    it('should allow access for admin user', () => {
      // Arrange
      mockRequest.user = {
        id: 1,
        email: 'admin@example.com',
        cnpj: '12345678901234',
        role: 'admin',
        companyType: 'both',
      };

      // Act
      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is customer (not admin)', () => {
      // Arrange
      mockRequest.user = {
        id: 2,
        email: 'customer@example.com',
        cnpj: '23456789012345',
        role: 'customer',
        companyType: 'buyer',
      };

      // Act
      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is supplier (not admin)', () => {
      // Arrange
      mockRequest.user = {
        id: 3,
        email: 'supplier@example.com',
        cnpj: '34567890123456',
        role: 'supplier',
        companyType: 'supplier',
      };

      // Act
      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null user object', () => {
      // Arrange
      mockRequest.user = null as any;

      // Act
      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });
  });

  describe('isSupplier', () => {
    it('should allow access for supplier user', () => {
      // Arrange
      mockRequest.user = {
        id: 1,
        email: 'supplier@example.com',
        cnpj: '12345678901234',
        role: 'supplier',
        companyType: 'supplier',
      };

      // Act
      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is customer (not supplier)', () => {
      // Arrange
      mockRequest.user = {
        id: 2,
        email: 'customer@example.com',
        cnpj: '23456789012345',
        role: 'customer',
        companyType: 'buyer',
      };

      // Act
      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Supplier access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is admin (not supplier)', () => {
      // Arrange
      mockRequest.user = {
        id: 3,
        email: 'admin@example.com',
        cnpj: '34567890123456',
        role: 'admin',
        companyType: 'both',
      };

      // Act
      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Supplier access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null user object', () => {
      // Arrange
      mockRequest.user = null as any;

      // Act
      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle authenticateJWT followed by isAdmin successfully', () => {
      // Arrange
      const mockToken = 'admin-integration-token';
      const adminPayload: AuthTokenPayload = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        cnpj: '12345678000195',
        companyType: 'both',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(adminPayload);

      // Act - Simulate middleware chain
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(adminPayload);

      // Reset mocks for next middleware
      jest.clearAllMocks();

      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle authenticateJWT followed by isSupplier successfully', () => {
      // Arrange
      const mockToken = 'supplier-integration-token';
      const supplierPayload: AuthTokenPayload = {
        id: 2,
        email: 'supplier@example.com',
        role: 'supplier',
        cnpj: '12345678000194',
        companyType: 'supplier',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(supplierPayload);

      // Act - Simulate middleware chain
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(supplierPayload);

      // Reset mocks for next middleware
      jest.clearAllMocks();

      isSupplier(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject customer user trying to access admin endpoint', () => {
      // Arrange
      const mockToken = 'customer-trying-admin-token';
      const customerPayload: AuthTokenPayload = {
        id: 3,
        email: 'customer@example.com',
        role: 'customer',
        cnpj: '12345678000199',
        companyType: 'buyer',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(customerPayload);

      // Act - Simulate middleware chain
      authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(customerPayload);

      // Reset mocks for next middleware
      jest.clearAllMocks();

      isAdmin(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing req object gracefully', () => {
      // Act & Assert
      expect(() => {
        authenticateJWT(null as any, mockResponse as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle missing res object gracefully', () => {
      // Act & Assert
      expect(() => {
        authenticateJWT(mockRequest as AuthenticatedRequest, null as any, mockNext);
      }).not.toThrow();
    });

    it('should handle missing next function gracefully', () => {
      // Arrange
      const mockToken = 'test-token';
      const mockPayload: AuthTokenPayload = {
        id: 1,
        email: 'test@example.com',
        role: 'customer',
        cnpj: '12345678000191',
        companyType: 'buyer',
      };

      mockRequest.headers = {
        authorization: `Bearer ${mockToken}`,
      };

      mockExtractTokenFromHeader.mockReturnValue(mockToken);
      mockVerifyToken.mockReturnValue(mockPayload);

      // Act & Assert
      expect(() => {
        authenticateJWT(mockRequest as AuthenticatedRequest, mockResponse as Response, null as any);
      }).not.toThrow();
    });
  });
});
