import { Quotation, ApiResponse } from '@shared/types';
import { apiService } from './api';

interface CreateQuotationRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
}

interface UpdateQuotationRequest {
  status?: 'pending' | 'processed' | 'completed' | 'rejected';
  adminNotes?: string;
}

class QuotationsService {
  // Customer methods
  async createQuotation(quotationData: CreateQuotationRequest): Promise<Quotation> {
    const response = await apiService.post<ApiResponse<Quotation>>('/quotations', quotationData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create quotation');
    }
    
    return response.data;
  }

  async getCustomerQuotations(): Promise<Quotation[]> {
    const response = await apiService.get<ApiResponse<Quotation[]>>('/quotations');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch quotations');
    }
    
    return response.data;
  }

  async getQuotationById(id: number): Promise<Quotation> {
    const response = await apiService.get<ApiResponse<Quotation>>(`/quotations/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch quotation');
    }
    
    return response.data;
  }

  // Admin methods
  async getAllQuotations(): Promise<Quotation[]> {
    const response = await apiService.get<ApiResponse<Quotation[]>>('/quotations/admin/all');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch all quotations');
    }
    
    return response.data;
  }

  async updateQuotation(id: number, updateData: UpdateQuotationRequest): Promise<Quotation> {
    const response = await apiService.put<ApiResponse<Quotation>>(`/quotations/admin/${id}`, updateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update quotation');
    }
    
    return response.data;
  }
}

export const quotationsService = new QuotationsService();