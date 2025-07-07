import { Order, ApiResponse } from '@shared/types';
import { apiService } from './api';

interface CreateOrderFromQuotationRequest {
  quotationId: number;
}

interface CreateOrderRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  shippingAddress: string;
}

interface ShippingCalculationResponse {
  cost: number;
  days: number;
}

interface UpdateOrderStatusRequest {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  notes?: string;
}

interface OrderHistory {
  order: Order;
  timeline: Array<{
    status: string;
    description: string;
    date: Date;
    canTransitionTo: string[];
  }>;
}

interface OrderStats {
  statusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  totalOrders: number;
  averageProcessingTime: number;
}

class OrdersService {
  // Create order from quotation
  async createOrderFromQuotation(orderData: CreateOrderFromQuotationRequest): Promise<Order> {
    const response = await apiService.post<ApiResponse<Order>>('/orders', orderData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create order');
    }

    return response.data;
  }

  // Create order directly (for cart checkout)
  async createOrder(orderData: CreateOrderRequest): Promise<{ orderId: number; order: Order }> {
    const response = await apiService.post<ApiResponse<{ orderId: number; order: Order }>>(
      '/orders/direct',
      orderData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create order');
    }

    return response.data;
  }

  // Calculate shipping cost
  async calculateShipping(cep: string, totalValue: number): Promise<ShippingCalculationResponse> {
    // Simulate shipping calculation based on CEP and order value
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido');
    }

    // Simulate different shipping costs based on CEP regions
    const firstDigit = parseInt(cleanCep[0]);
    let baseCost = 0;
    let days = 0;

    // Simple simulation based on Brazilian CEP regions
    switch (firstDigit) {
      case 0: // São Paulo (metropolitan area)
      case 1:
        baseCost = 15;
        days = 2;
        break;
      case 2: // Rio de Janeiro and ES
      case 3: // Minas Gerais
        baseCost = 20;
        days = 3;
        break;
      case 4: // Bahia and SE
      case 5: // PE, PB, RN, AL
        baseCost = 25;
        days = 5;
        break;
      case 6: // CE, PI, MA
      case 7: // DF, GO, TO
        baseCost = 30;
        days = 6;
        break;
      case 8: // PR, SC
        baseCost = 18;
        days = 4;
        break;
      case 9: // RS, RO, AC, AM, RR, AP, PA
        baseCost = 35;
        days = 7;
        break;
      default:
        baseCost = 25;
        days = 5;
    }

    // Apply free shipping for orders over R$ 500
    if (totalValue >= 500) {
      baseCost = 0;
    } else if (totalValue >= 200) {
      baseCost = baseCost * 0.5; // 50% discount for orders over R$ 200
    }

    return {
      cost: Math.round(baseCost * 100) / 100, // Round to 2 decimal places
      days,
    };
  }

  // Get user's orders with pagination and filtering
  async getUserOrders(params?: { status?: string; page?: number; limit?: number }): Promise<{
    orders: Order[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiService.get<
      ApiResponse<{
        orders: Order[];
        pagination: any;
      }>
    >(`/orders/user?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch orders');
    }

    return response.data;
  }

  // Get order by ID
  async getOrderById(id: string): Promise<Order> {
    const response = await apiService.get<ApiResponse<Order>>(`/orders/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch order');
    }

    return response.data;
  }

  // Get order history and timeline
  async getOrderHistory(id: string): Promise<OrderHistory> {
    const response = await apiService.get<ApiResponse<OrderHistory>>(`/orders/${id}/history`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch order history');
    }

    return response.data;
  }

  // Update order status (admin/supplier only)
  async updateOrderStatus(id: string, updateData: UpdateOrderStatusRequest): Promise<Order> {
    const response = await apiService.put<ApiResponse<Order>>(`/orders/${id}/status`, updateData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update order status');
    }

    return response.data;
  }

  // Get all orders (admin only)
  async getAllOrders(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiService.get<
      ApiResponse<{
        orders: Order[];
        pagination: any;
      }>
    >(`/orders/admin/all?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch orders');
    }

    return response.data;
  }

  // Get order statistics (admin only)
  async getOrderStats(): Promise<OrderStats> {
    const response = await apiService.get<ApiResponse<OrderStats>>('/orders/admin/stats');

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch order statistics');
    }

    return response.data;
  }

  // Helper methods
  getStatusColor(
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const ordersService = new OrdersService();
export type { CreateOrderRequest, ShippingCalculationResponse };
