import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { User, AuthResponse } from '@shared/types';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';

// Mock the services
vi.mock('../../services/authService');
vi.mock('../../services/api');

const mockAuthService = authService as any;
const mockApiService = apiService as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the AuthContext
const TestComponent: React.FC = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid='isAuthenticated'>{auth.isAuthenticated.toString()}</div>
      <div data-testid='isLoading'>{auth.isLoading.toString()}</div>
      <div data-testid='user-id'>{auth.user?.id || 'null'}</div>
      <div data-testid='user-email'>{auth.user?.email || 'null'}</div>
      <div data-testid='user-role'>{auth.user?.role || 'null'}</div>
      <div data-testid='user-cnpj'>{auth.user?.cnpj || 'null'}</div>
      <div data-testid='user-company-name'>{auth.user?.companyName || 'null'}</div>
      <div data-testid='access-token'>{auth.accessToken || 'null'}</div>
      <div data-testid='refresh-token'>{auth.refreshToken || 'null'}</div>

      <button data-testid='login-btn' onClick={() => auth.login('12345678000190', 'password123')}>
        Login
      </button>

      <button
        data-testid='login-email-btn'
        onClick={() => auth.loginWithEmail('test@example.com', 'password123')}
      >
        Login with Email
      </button>

      <button
        data-testid='register-btn'
        onClick={() =>
          auth.register({
            email: 'test@example.com',
            password: 'password123',
            cpf: '12345678901',
            address: 'Test Address',
            companyName: 'Test Company',
            corporateName: 'Test Company LTDA',
            cnpj: '12345678000190',
            industrySector: 'technology',
            companyType: 'buyer',
          })
        }
      >
        Register
      </button>

      <button data-testid='logout-btn' onClick={() => auth.logout()}>
        Logout
      </button>

      <button data-testid='fetch-user-btn' onClick={() => auth.fetchUser()}>
        Fetch User
      </button>
    </div>
  );
};

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorageMock.clear();

    // Mock default API service behavior
    mockApiService.getRawApi = vi.fn(() => ({
      defaults: {
        headers: {
          common: {},
        },
      },
    }));
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('Initial State', () => {
    it('should start with unauthenticated state when no tokens in localStorage', () => {
      renderWithAuthProvider();

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');
    });

    it('should start with loading state when access token exists in localStorage', async () => {
      localStorageMock.setItem('crescebr_access_token', 'test-access-token');
      localStorageMock.setItem('crescebr_refresh_token', 'test-refresh-token');

      // Mock the API call that will be triggered
      mockApiService.get = vi.fn().mockRejectedValue(new Error('Token invalid'));

      renderWithAuthProvider();

      // Check initial loading state - tokens should be loaded from localStorage
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      // The loading state should eventually become false after the failed API call
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      // After failed API call, tokens should be cleared
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');
    });
  });

  describe('Initialization from localStorage', () => {
    it('should automatically fetch user when valid token exists', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        cpf: '123.456.789-01',
        address: 'Test Address',
        role: 'customer',
        companyName: 'Test Company',
        corporateName: 'Test Company LTDA',
        cnpj: '12.345.678/0001-90',
        cnpjValidated: true,
        industrySector: 'technology',
        companyType: 'buyer',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      localStorageMock.setItem('crescebr_access_token', 'valid-token');
      localStorageMock.setItem('crescebr_refresh_token', 'valid-refresh-token');

      mockApiService.get = vi.fn().mockResolvedValue({
        success: true,
        data: { user: mockUser },
      });

      renderWithAuthProvider();

      // Wait for user to be loaded with increased timeout
      await waitFor(
        () => {
          expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        },
        { timeout: 10000 }
      );

      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('1');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('customer');
      expect(screen.getByTestId('user-cnpj')).toHaveTextContent('12.345.678/0001-90');
      expect(screen.getByTestId('user-company-name')).toHaveTextContent('Test Company');

      // Verify API call was made with correct endpoint
      expect(mockApiService.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should clear tokens and set unauthenticated when token is invalid', async () => {
      localStorageMock.setItem('crescebr_access_token', 'invalid-token');
      localStorageMock.setItem('crescebr_refresh_token', 'invalid-refresh-token');

      mockApiService.get = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      renderWithAuthProvider();

      // Wait for the invalid token to be processed and cleared
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');

      // Verify tokens were removed from localStorage
      expect(localStorageMock.getItem('crescebr_access_token')).toBeNull();
      expect(localStorageMock.getItem('crescebr_refresh_token')).toBeNull();
    });
  });

  describe('Login', () => {
    it('should login successfully with CNPJ and update state', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        cpf: '123.456.789-01',
        address: 'Test Address',
        role: 'customer',
        companyName: 'Test Company',
        corporateName: 'Test Company LTDA',
        cnpj: '12.345.678/0001-90',
        cnpjValidated: true,
        industrySector: 'technology',
        companyType: 'buyer',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResponse: AuthResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: mockUser,
      };

      mockAuthService.login = vi.fn().mockResolvedValue(mockAuthResponse);

      renderWithAuthProvider();

      // Initially not authenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      // Click login button
      await act(async () => {
        fireEvent.click(screen.getByTestId('login-btn'));
      });

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('1');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('customer');
      expect(screen.getByTestId('user-cnpj')).toHaveTextContent('12.345.678/0001-90');
      expect(screen.getByTestId('user-company-name')).toHaveTextContent('Test Company');
      expect(screen.getByTestId('access-token')).toHaveTextContent('mock-access-token');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('mock-refresh-token');

      // Verify authService.login was called with correct parameters
      expect(mockAuthService.login).toHaveBeenCalledWith('12345678000190', 'password123');

      // Verify tokens were saved to localStorage
      expect(localStorageMock.getItem('crescebr_access_token')).toBe('mock-access-token');
      expect(localStorageMock.getItem('crescebr_refresh_token')).toBe('mock-refresh-token');
    });

    it('should handle login failure correctly', async () => {
      mockAuthService.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));

      renderWithAuthProvider();

      await act(async () => {
        try {
          fireEvent.click(screen.getByTestId('login-btn'));
        } catch (error) {
          // Expected error, ignore
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');
    });
  });

  describe('Login with Email', () => {
    it('should login successfully with email and update state', async () => {
      const mockUser: User = {
        id: 2,
        email: 'email@example.com',
        cpf: '987.654.321-00',
        address: 'Email Test Address',
        role: 'admin',
        companyName: 'Email Test Company',
        corporateName: 'Email Test Company LTDA',
        cnpj: '98.765.432/0001-88',
        cnpjValidated: true,
        industrySector: 'technology',
        companyType: 'both',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResponse: AuthResponse = {
        accessToken: 'email-access-token',
        refreshToken: 'email-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: mockUser,
      };

      mockAuthService.loginWithEmail = vi.fn().mockResolvedValue(mockAuthResponse);

      renderWithAuthProvider();

      await act(async () => {
        fireEvent.click(screen.getByTestId('login-email-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('2');
      expect(screen.getByTestId('user-email')).toHaveTextContent('email@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      expect(screen.getByTestId('access-token')).toHaveTextContent('email-access-token');

      expect(mockAuthService.loginWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  describe('Register', () => {
    it('should register successfully and update state', async () => {
      const mockUser: User = {
        id: 3,
        email: 'newuser@example.com',
        cpf: '111.222.333-44',
        address: 'New User Address',
        role: 'customer',
        companyName: 'New Company',
        corporateName: 'New Company LTDA',
        cnpj: '11.222.333/0001-44',
        cnpjValidated: false,
        industrySector: 'technology',
        companyType: 'buyer',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResponse: AuthResponse = {
        accessToken: 'register-access-token',
        refreshToken: 'register-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: mockUser,
      };

      mockAuthService.register = vi.fn().mockResolvedValue(mockAuthResponse);

      renderWithAuthProvider();

      await act(async () => {
        fireEvent.click(screen.getByTestId('register-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('3');
      expect(screen.getByTestId('user-email')).toHaveTextContent('newuser@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('customer');
      expect(screen.getByTestId('access-token')).toHaveTextContent('register-access-token');

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        cpf: '12345678901',
        address: 'Test Address',
        companyName: 'Test Company',
        corporateName: 'Test Company LTDA',
        cnpj: '12345678000190',
        industrySector: 'technology',
        companyType: 'buyer',
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully and clear state', async () => {
      // First, set up authenticated state
      localStorageMock.setItem('crescebr_access_token', 'test-token');
      localStorageMock.setItem('crescebr_refresh_token', 'test-refresh');

      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        cpf: '123.456.789-01',
        address: 'Test Address',
        role: 'customer',
        companyName: 'Test Company',
        corporateName: 'Test Company LTDA',
        cnpj: '12.345.678/0001-90',
        cnpjValidated: true,
        industrySector: 'technology',
        companyType: 'buyer',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.get = vi.fn().mockResolvedValue({
        success: true,
        data: { user: mockUser },
      });

      renderWithAuthProvider();

      // Wait for auto-login to complete with increased timeout
      await waitFor(
        () => {
          expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
        },
        { timeout: 10000 }
      );

      // Now logout
      await act(async () => {
        fireEvent.click(screen.getByTestId('logout-btn'));
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');

      // Verify tokens were removed from localStorage
      expect(localStorageMock.getItem('crescebr_access_token')).toBeNull();
      expect(localStorageMock.getItem('crescebr_refresh_token')).toBeNull();
    });
  });

  describe('Fetch User', () => {
    it('should fetch user successfully when valid token exists', async () => {
      localStorageMock.setItem('crescebr_access_token', 'valid-token');
      localStorageMock.setItem('crescebr_refresh_token', 'valid-refresh');

      const mockUser: User = {
        id: 1,
        email: 'fetched@example.com',
        cpf: '123.456.789-01',
        address: 'Fetched Address',
        role: 'supplier',
        companyName: 'Fetched Company',
        corporateName: 'Fetched Company LTDA',
        cnpj: '12.345.678/0001-90',
        cnpjValidated: true,
        industrySector: 'machinery',
        companyType: 'supplier',
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock successful API response
      mockApiService.get = vi.fn().mockResolvedValue({
        success: true,
        data: { user: mockUser },
      });

      renderWithAuthProvider();

      // Wait for auto-initialization to complete first
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Now manually trigger fetchUser
      await act(async () => {
        fireEvent.click(screen.getByTestId('fetch-user-btn'));
      });

      // Verify user data is displayed
      expect(screen.getByTestId('user-email')).toHaveTextContent('fetched@example.com');
      expect(screen.getByTestId('user-role')).toHaveTextContent('supplier');
      expect(screen.getByTestId('user-company-name')).toHaveTextContent('Fetched Company');
    });

    it('should handle fetch user failure when token is invalid', async () => {
      localStorageMock.setItem('crescebr_access_token', 'invalid-token');
      localStorageMock.setItem('crescebr_refresh_token', 'invalid-refresh');

      mockApiService.get = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      renderWithAuthProvider();

      await act(async () => {
        fireEvent.click(screen.getByTestId('fetch-user-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user-id')).toHaveTextContent('null');
      expect(screen.getByTestId('access-token')).toHaveTextContent('null');
      expect(screen.getByTestId('refresh-token')).toHaveTextContent('null');

      // Verify tokens were cleared
      expect(localStorageMock.getItem('crescebr_access_token')).toBeNull();
      expect(localStorageMock.getItem('crescebr_refresh_token')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});
