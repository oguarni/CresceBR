import { Product, ApiResponse } from '@shared/types';
import { apiService } from './api';

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ProductsQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class ProductsService {
  async getAllProducts(params?: ProductsQueryParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query ? `/products?${query}` : '/products';
    
    const response = await apiService.get<ApiResponse<ProductsResponse>>(url);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch products');
    }
    
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await apiService.get<ApiResponse<Product>>(`/products/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch product');
    }
    
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await apiService.get<ApiResponse<string[]>>('/products/categories');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch categories');
    }
    
    return response.data;
  }

  // Admin methods
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await apiService.post<ApiResponse<Product>>('/products', productData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create product');
    }
    
    return response.data;
  }

  async updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const response = await apiService.put<ApiResponse<Product>>(`/products/${id}`, productData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update product');
    }
    
    return response.data;
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await apiService.delete<ApiResponse<void>>(`/products/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete product');
    }
  }
}

export const productsService = new ProductsService();