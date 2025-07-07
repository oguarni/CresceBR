import { screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { vi } from 'vitest';
import AdminProductsPage from '../AdminProductsPage';
import { renderWithProviders } from '../../test-utils'; // Import the custom render function
import { User } from '../../../../shared/types';

// Mock axios calls
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock admin user data
const mockAdminUser: User = {
  id: 'admin-id',
  email: 'admin@crescebr.com',
  companyName: 'Admin Company',
  cnpj: '11.111.111/0001-11',
  role: 'admin',
  status: 'approved',
  street: 'Admin Street',
  number: '1',
  city: 'Admin City',
  state: 'AS',
  zipCode: '11111-111',
};

const mockProducts = [
  { id: '1', name: 'Product 1', price: 100, description: 'Desc 1', stock: 10, companyId: 'comp-1' },
  { id: '2', name: 'Product 2', price: 200, description: 'Desc 2', stock: 20, companyId: 'comp-2' },
];

describe('AdminProductsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedAxios.get.mockResolvedValue({ data: mockProducts });
    mockedAxios.post.mockResolvedValue({
      data: {
        id: '3',
        name: 'New Product',
        price: 150,
        description: 'New Desc',
        stock: 50,
        companyId: 'comp-1',
      },
    });
    vi.clearAllMocks();
  });

  it('should render products list and add new product form', async () => {
    // Use renderWithProviders to ensure context is available
    renderWithProviders(<AdminProductsPage />, {
      authContext: { user: mockAdminUser, isAuthenticated: true, role: 'admin' },
    });

    // Check if the title and products are rendered
    expect(screen.getByText('Gerenciamento de Produtos')).toBeInTheDocument();
    expect(await screen.findByText('Product 1')).toBeInTheDocument();
    expect(await screen.findByText('Product 2')).toBeInTheDocument();

    // Check if the "Add Product" form is visible
    expect(screen.getByLabelText(/Nome do Produto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preço/i)).toBeInTheDocument();
  });

  it('should allow an admin to add a new product', async () => {
    renderWithProviders(<AdminProductsPage />, {
      authContext: { user: mockAdminUser, isAuthenticated: true, role: 'admin' },
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Nome do Produto/i), {
      target: { value: 'New Product' },
    });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: 'New Desc' } });
    fireEvent.change(screen.getByLabelText(/Estoque/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/ID da Empresa/i), { target: { value: 'comp-1' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Produto/i }));

    // Wait for the new product to appear in the list
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), {
        name: 'New Product',
        price: 150,
        description: 'New Desc',
        stock: 50,
        companyId: 'comp-1',
      });
    });

    expect(await screen.findByText('New Product')).toBeInTheDocument();
  });
});
