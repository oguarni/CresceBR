import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import QuotationRequestPage from '../QuotationRequestPage';
import * as productsService from '../../services/productsService';
import * as quotationsService from '../../services/quotationsService';
import { renderWithProviders } from '../../test-utils'; // Import the custom render function
import { User } from '../../../../shared/types';

// Mock services
vi.mock('../../services/productsService');
vi.mock('../../services/quotationsService');

const mockedProductsService = productsService as jest.Mocked<typeof productsService>;
const mockedQuotationsService = quotationsService as jest.Mocked<typeof quotationsService>;

const mockProducts = [
  {
    id: '1',
    name: 'Laptop',
    price: 3000,
    description: 'A great laptop',
    stock: 10,
    companyId: 'comp-1',
  },
  {
    id: '2',
    name: 'Mouse',
    price: 100,
    description: 'A great mouse',
    stock: 100,
    companyId: 'comp-2',
  },
];

const mockBuyerUser: User = {
  id: 'buyer-id',
  email: 'buyer@example.com',
  companyName: 'Buyer Inc.',
  cnpj: '22.222.222/0001-22',
  role: 'buyer',
  status: 'approved',
  street: 'Buyer Street',
  number: '456',
  city: 'Buyer City',
  state: 'BS',
  zipCode: '22222-222',
};

describe('QuotationRequestPage', () => {
  beforeEach(() => {
    mockedProductsService.getProducts.mockResolvedValue(mockProducts);
    mockedQuotationsService.createQuotation.mockResolvedValue({
      id: 'quote-123',
      userId: 'buyer-id',
      items: [{ productId: '1', quantity: 2, unitPrice: 3000 }],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.clearAllMocks();
  });

  it('should render the page, products, and allow submitting a quotation', async () => {
    renderWithProviders(<QuotationRequestPage />, {
      authContext: { user: mockBuyerUser, isAuthenticated: true, role: 'buyer' },
    });

    // Check for title
    expect(screen.getByText('Solicitar Cotação')).toBeInTheDocument();

    // Check for products loaded from the service
    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(await screen.findByText('Mouse')).toBeInTheDocument();

    // Simulate adding a product to the quotation
    const quantityInput = screen.getAllByRole('spinbutton')[0]; // First product's quantity
    fireEvent.change(quantityInput, { target: { value: '2' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Adicionar/i })[0]);

    // Check if the item was added to the request list
    expect(screen.getByText(/Laptop x2/i)).toBeInTheDocument();

    // Submit the quotation
    fireEvent.click(screen.getByRole('button', { name: /Enviar Solicitação de Cotação/i }));

    // Assert that the createQuotation service function was called
    await waitFor(() => {
      expect(mockedQuotationsService.createQuotation).toHaveBeenCalledWith({
        items: [{ productId: '1', quantity: 2 }],
      });
    });

    // Check for success message
    expect(await screen.findByText(/Cotação enviada com sucesso!/i)).toBeInTheDocument();
  });
});
