import { AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '@shared/types';
import { apiService } from './api';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const loginData: LoginRequest = { email, password };
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', loginData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }
    
    return response.data;
  }

  async register(email: string, password: string, cpf: string, address: string): Promise<AuthResponse> {
    const registerData: RegisterRequest = { email, password, cpf, address };
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/register', registerData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    // In a real app, you might want to invalidate the token on the server
    localStorage.removeItem('crescebr_token');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('crescebr_token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('crescebr_token');
  }
}

export const authService = new AuthService();