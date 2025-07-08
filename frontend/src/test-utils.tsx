import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthContext, AuthContextType } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { QuotationProvider } from './contexts/QuotationContext';
import theme from './theme';
import { User } from '../../shared/types';

// Mock user data for testing purposes
const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  companyName: 'Test Corp',
  cnpj: '00.000.000/0001-00',
  role: 'buyer',
  status: 'approved',
  street: 'Test Street',
  number: '123',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345-678',
};

// Create a customizable mock auth context
const createMockAuthContext = (
  user: User | null,
  role: 'admin' | 'buyer' | 'supplier' = 'buyer'
): AuthContextType => ({
  user: user ? { ...user, role } : null,
  token: user ? 'fake-token' : null,
  isAuthenticated: !!user,
  isLoading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  checkAuth: vi.fn().mockResolvedValue(undefined),
});

interface CustomRenderOptions {
  initialRoutes?: string[];
  authContext?: Partial<AuthContextType>;
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
}

// The custom render function that wraps components with all necessary providers
const renderWithProviders = (
  ui: ReactElement,
  {
    initialRoutes = ['/'],
    authContext = createMockAuthContext(mockUser),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <MemoryRouter initialEntries={initialRoutes}>
        <ChakraProvider theme={theme}>
          <AuthContext.Provider value={authContext as AuthContextType}>
            <CartProvider>
              <QuotationProvider>{children}</QuotationProvider>
            </CartProvider>
          </AuthContext.Provider>
        </ChakraProvider>
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
// Override the render method with our custom one
export { renderWithProviders as render };
