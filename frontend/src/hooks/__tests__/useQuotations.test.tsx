import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { Product, Quotation } from '@shared/types';
import { useQuotations, useQuotation } from '../useQuotations';

vi.mock('../../services/quotationsService', () => ({
  quotationsService: {
    getCustomerQuotations: vi.fn(),
    getQuotationById: vi.fn(),
  },
}));

import { quotationsService } from '../../services/quotationsService';

const mockProduct: Product = {
  id: 1,
  name: 'Product A',
  description: 'Description A',
  price: 100,
  imageUrl: 'https://example.com/product.jpg',
  category: 'Industrial',
  supplierId: 2,
  tierPricing: [],
  specifications: {},
  unitPrice: 100,
  minimumOrderQuantity: 1,
  leadTime: 7,
  availability: 'in_stock',
};

const mockQuotations: Quotation[] = [
  {
    id: 1,
    companyId: 1,
    status: 'pending' as const,
    adminNotes: null,
    items: [{ id: 1, quotationId: 1, productId: 1, product: mockProduct, quantity: 10 }],
    totalAmount: 1000,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 2,
    companyId: 1,
    status: 'processed' as const,
    adminNotes: null,
    items: [{ id: 2, quotationId: 2, productId: 1, product: mockProduct, quantity: 5 }],
    totalAmount: 500,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
];

describe('useQuotations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch quotations on mount with autoFetch=true (default)', async () => {
    vi.mocked(quotationsService.getCustomerQuotations).mockResolvedValueOnce(mockQuotations);

    const { result } = renderHook(() => useQuotations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotations).toEqual(mockQuotations);
    expect(result.current.error).toBeNull();
    expect(quotationsService.getCustomerQuotations).toHaveBeenCalledTimes(1);
  });

  it('should not fetch with autoFetch=false', async () => {
    const { result } = renderHook(() => useQuotations({ autoFetch: false }));

    await waitFor(() => {
      expect(quotationsService.getCustomerQuotations).not.toHaveBeenCalled();
    });

    expect(result.current.quotations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should handle error', async () => {
    vi.mocked(quotationsService.getCustomerQuotations).mockRejectedValueOnce(
      new Error('Server error')
    );

    const { result } = renderHook(() => useQuotations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.quotations).toEqual([]);
  });

  it('should handle non-Error failure', async () => {
    vi.mocked(quotationsService.getCustomerQuotations).mockRejectedValueOnce('unknown');

    const { result } = renderHook(() => useQuotations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('An unexpected error occurred');
  });

  it('should refetch quotations when refetch is called', async () => {
    vi.mocked(quotationsService.getCustomerQuotations).mockResolvedValueOnce(mockQuotations);

    const { result } = renderHook(() => useQuotations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedQuotations = [mockQuotations[0]];
    vi.mocked(quotationsService.getCustomerQuotations).mockResolvedValueOnce(updatedQuotations);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.quotations).toEqual(updatedQuotations);
    expect(quotationsService.getCustomerQuotations).toHaveBeenCalledTimes(2);
  });

  it('should clear error on refetch', async () => {
    vi.mocked(quotationsService.getCustomerQuotations).mockRejectedValueOnce(
      new Error('Server error')
    );

    const { result } = renderHook(() => useQuotations());

    await waitFor(() => {
      expect(result.current.error).toBe('Server error');
    });

    vi.mocked(quotationsService.getCustomerQuotations).mockResolvedValueOnce(mockQuotations);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.quotations).toEqual(mockQuotations);
  });
});

describe('useQuotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch quotation by id', async () => {
    const mockQuotation = mockQuotations[0];
    vi.mocked(quotationsService.getQuotationById).mockResolvedValueOnce(mockQuotation);

    const { result } = renderHook(() => useQuotation(1));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotation).toEqual(mockQuotation);
    expect(result.current.error).toBeNull();
    expect(quotationsService.getQuotationById).toHaveBeenCalledWith(1);
  });

  it('should handle error', async () => {
    vi.mocked(quotationsService.getQuotationById).mockRejectedValueOnce(
      new Error('Quotation not found')
    );

    const { result } = renderHook(() => useQuotation(999));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Quotation not found');
    expect(result.current.quotation).toBeNull();
  });

  it('should handle non-Error failure', async () => {
    vi.mocked(quotationsService.getQuotationById).mockRejectedValueOnce('unknown');

    const { result } = renderHook(() => useQuotation(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('An unexpected error occurred');
  });
});
