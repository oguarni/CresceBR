export interface User {
  id: number;
  email: string;
  password?: string; // Optional for responses (excluded for security)
  cpf: string;
  address: string;
  role: 'customer' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuotationItem {
  id: number;
  quotationId: number;
  productId: number;
  product: Product;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Quotation {
  id: number;
  userId: number;
  user?: Omit<User, 'password'>;
  items: QuotationItem[];
  status: 'pending' | 'processed' | 'completed' | 'rejected';
  adminNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Keep CartItem for backwards compatibility during migration
export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  totalPrice: number;
}

export interface AuthTokenPayload {
  id: number;
  email: string;
  role: 'customer' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  cpf: string;
  address: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}