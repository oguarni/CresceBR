export interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  discount: number;
}

export interface User {
  id: number;
  email: string;
  password?: string; // Optional for responses (excluded for security)
  cpf: string;
  address: string;
  role: 'customer' | 'admin' | 'supplier';
  status: 'pending' | 'approved' | 'rejected';
  companyName?: string;
  corporateName?: string;
  cnpj?: string;
  cnpjValidated?: boolean;
  industrySector?: string;
  averageRating?: number;
  totalRatings?: number;
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
  supplierId?: number;
  tierPricing?: PricingTier[];
  specifications?: Record<string, any>;
  unitPrice?: number;
  minimumOrderQuantity?: number;
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
  role?: 'customer' | 'supplier';
  companyName?: string;
  corporateName?: string;
  cnpj?: string;
  industrySector?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface Order {
  id: string;
  userId: number;
  user?: Omit<User, 'password'>;
  quotationId?: number;
  quotation?: Quotation;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDeliveryDate?: Date;
  trackingNumber?: string;
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

export interface Rating {
  id: number;
  supplierId: number;
  buyerId: number;
  orderId?: string;
  score: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderStatusHistory {
  id: number;
  orderId: string;
  fromStatus?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  toStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  changedBy: number;
  notes?: string;
  createdAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
