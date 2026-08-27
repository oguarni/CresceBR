import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { Company, Order, Product, Quotation } from '@shared/types';
import SupplierDashboardPage from '../SupplierDashboardPage';
import { ordersService } from '../../services/ordersService';
import { quotationsService } from '../../services/quotationsService';

// Mock services
vi.mock('../../services/ordersService', () => ({
  ordersService: {
    getUserOrders: vi.fn(),
  },
}));

vi.mock('../../services/quotationsService', () => ({
  quotationsService: {
    getSupplierQuotations: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'supplier', companyName: 'Test Supplier' },
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const makeProduct = (id: number, name: string, price: number): Product => ({
  id,
  name,
  description: `${name} description`,
  price,
  imageUrl: '',
  category: 'Industrial',
  supplierId: 1,
  tierPricing: [],
  specifications: {},
  unitPrice: price,
  minimumOrderQuantity: 1,
  leadTime: 7,
  availability: 'in_stock',
});

const mockBuyer: Company = {
  id: 2,
  email: 'buyer@example.com',
  cpf: '12345678901',
  address: 'Rua Teste, 123',
  role: 'customer',
  status: 'approved',
  companyName: 'Buyer Corp',
  corporateName: 'Buyer Corp',
  cnpj: '12345678000190',
  cnpjValidated: true,
  industrySector: 'Industrial',
  companyType: 'buyer',
};

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    companyId: 2,
    status: 'pending',
    totalAmount: 5000,
    createdAt: new Date('2026-03-15T10:00:00Z'),
    shippingAddress: 'Rua Teste, 123',
    notes: null,
    items: [
      {
        id: 1,
        orderId: 1,
        productId: 1,
        product: makeProduct(1, 'Pump', 2500),
        quantity: 2,
        price: 2500,
        totalPrice: 5000,
      },
    ],
    company: mockBuyer,
  },
  {
    id: 'ORD-002',
    companyId: 3,
    status: 'processing',
    totalAmount: 3200,
    createdAt: new Date('2026-03-14T10:00:00Z'),
    shippingAddress: 'Avenida Teste, 456',
    notes: null,
    items: [
      {
        id: 2,
        orderId: 2,
        productId: 2,
        product: makeProduct(2, 'Valve', 640),
        quantity: 5,
        price: 640,
        totalPrice: 3200,
      },
    ],
    company: {
      ...mockBuyer,
      id: 3,
      companyName: 'Another Buyer',
      corporateName: 'Another Buyer',
    },
  },
];

const mockQuotations: Quotation[] = [
  {
    id: 1,
    companyId: 2,
    status: 'pending',
    adminNotes: null,
    createdAt: new Date('2026-03-15T10:00:00Z'),
    company: mockBuyer,
    items: [
      {
        id: 1,
        quotationId: 1,
        productId: 1,
        quantity: 10,
        product: makeProduct(1, 'Pump', 500),
      },
    ],
  },
  {
    id: 2,
    companyId: 3,
    status: 'processed',
    adminNotes: null,
    createdAt: new Date('2026-03-14T10:00:00Z'),
    company: {
      ...mockBuyer,
      id: 3,
      companyName: 'Another Buyer',
      corporateName: 'Another Buyer',
    },
    items: [
      {
        id: 2,
        quotationId: 2,
        productId: 2,
        quantity: 20,
        product: makeProduct(2, 'Valve', 100),
      },
    ],
  },
];

const renderPage = async () => {
  let renderResult;
  await act(async () => {
    renderResult = render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SupplierDashboardPage />
      </BrowserRouter>
    );
  });
  return renderResult!;
};

describe('SupplierDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ordersService.getUserOrders).mockResolvedValue({
      orders: mockOrders,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(quotationsService.getSupplierQuotations).mockResolvedValue(mockQuotations);
  });

  it('renders dashboard header with supplier branding', async () => {
    await renderPage();

    await waitFor(() => {
      // The "BR" in the title is rendered as an inline BrazilFlag SVG (aria-label
      // "Brazil"), so the heading reads "Cresce <flag> Fornecedor" across elements.
      expect(screen.getByRole('heading', { name: /Cresce.*Fornecedor/i })).toBeInTheDocument();
    });
  });

  it('displays metrics cards after loading', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Ativos')).toBeInTheDocument();
      expect(screen.getByText('Receita')).toBeInTheDocument();
    });
  });

  it('renders recent orders from the service', async () => {
    await renderPage();

    await waitFor(() => {
      expect(ordersService.getUserOrders).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
      expect(screen.getByText('Pedido #ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Pedido #ORD-002')).toBeInTheDocument();
    });
  });

  it('renders quotation queue from the service', async () => {
    await renderPage();

    await waitFor(() => {
      expect(quotationsService.getSupplierQuotations).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Fila de Cotações')).toBeInTheDocument();
      expect(screen.getByText('#QT-1')).toBeInTheDocument();
      expect(screen.getByText('#QT-2')).toBeInTheDocument();
    });
  });

  it('shows user avatar initials from companyName', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });

  it('handles error when loading dashboard data', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ordersService.getUserOrders).mockRejectedValue(new Error('Network error'));
    vi.mocked(quotationsService.getSupplierQuotations).mockRejectedValue(
      new Error('Network error')
    );

    await renderPage();

    await waitFor(
      () => {
        expect(ordersService.getUserOrders).toHaveBeenCalled();
        expect(quotationsService.getSupplierQuotations).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );

    consoleSpy.mockRestore();
  }, 15000);
});
