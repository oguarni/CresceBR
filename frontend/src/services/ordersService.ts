import { Order, ApiResponse } from '@shared/types';
import { apiService } from './api';

interface CreateOrderRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  shippingAddress: string;
}

interface CreateOrderResponse {
  orderId: number;
  totalAmount: number;
  status: string;
  estimatedDelivery: string;
}

class OrdersService {
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await apiService.post<ApiResponse<CreateOrderResponse>>('/orders', orderData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create order');
    }
    
    return response.data;
  }

  async getOrderById(id: number): Promise<Order> {
    const response = await apiService.get<ApiResponse<Order>>(`/orders/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch order');
    }
    
    return response.data;
  }

  // Helper method to calculate shipping cost (simulated)
  calculateShipping(cep: string, totalValue: number): Promise<{ cost: number; days: number }> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // Simple shipping calculation based on CEP and total value
        const baseCost = 15.00; // Base shipping cost
        const weightCost = Math.ceil(totalValue / 1000) * 5; // R$5 per R$1000
        const cost = baseCost + weightCost;
        
        // Simulate different delivery times based on CEP region
        const cepNumber = parseInt(cep.replace(/\D/g, ''));
        let days = 5; // Default 5 days
        
        if (cepNumber >= 80000 && cepNumber <= 87999) {
          // Paraná region - faster delivery
          days = 3;
        } else if (cepNumber >= 88000 && cepNumber <= 89999) {
          // Santa Catarina region
          days = 4;
        }
        
        resolve({ cost, days });
      }, 1000);
    });
  }
}

export const ordersService = new OrdersService();