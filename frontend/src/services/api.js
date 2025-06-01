import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      cnpj: userData.cnpj,
      companyName: userData.companyName,
      role: userData.role,
      address: userData.address,
      phone: userData.phone
    });
    return response.data;
  }

  async getProducts(filters = {}) {
    const response = await this.api.get('/products', { params: filters });
    return response.data;
  }

  async createProduct(productData) {
    const response = await this.api.post('/products', productData);
    return response.data;
  }

  async updateProduct(id, productData) {
    const response = await this.api.put(`/products/${id}`, productData);
    return response.data;
  }

  async deleteProduct(id) {
    const response = await this.api.delete(`/products/${id}`);
    return response.data;
  }

  async createOrder(orderData) {
    const response = await this.api.post('/orders', orderData);
    return response.data;
  }

  async getUserOrders() {
    const response = await this.api.get('/orders/user');
    return response.data;
  }

  async getSupplierOrders() {
    const response = await this.api.get('/orders/supplier');
    return response.data;
  }

  async updateOrderStatus(orderId, status) {
    const response = await this.api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  }

  async seedDatabase() {
    const response = await this.api.post('/seed');
    return response.data;
  }
}

export const apiService = new ApiService();