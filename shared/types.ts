export interface User {
  id: number;
  email: string;
  password?: string; // Optional for responses (excluded for security)
  cpf: string;
  address: string;
  role: 'customer' | 'admin' | 'supplier';
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
  role: 'customer' | 'admin' | 'supplier';
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

export interface Order {
  id: number;
  userId: number;
  user?: Omit<User, 'password'>;
  quotationId?: number;
  quotation?: Quotation;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
