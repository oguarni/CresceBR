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
  }

  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
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

  async seedDatabase() {
    const response = await this.api.post('/seed');
    return response.data;
  }
}

export const apiService = new ApiService();