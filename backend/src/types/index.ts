// Re-export shared types and add backend-specific types
export * from '../../../shared/types';

// Authentication types (temporarily defined here for source builds)
export interface AuthTokenPayload {
  id: number;
  email: string;
  cnpj: string;
  role: 'customer' | 'admin' | 'supplier';
  companyType: 'buyer' | 'supplier' | 'both';
}

export interface LoginRequest {
  cnpj: string;
  password: string;
}

export interface LoginEmailRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  cpf: string;
  address: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  contactPerson?: string;
  contactTitle?: string;
  companySize?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
  annualRevenue?: 'under_500k' | '500k_2m' | '2m_10m' | '10m_50m' | '50m_200m' | 'over_200m';
  certifications?: string[];
  website?: string;
  role?: 'customer' | 'supplier';
  companyName: string;
  corporateName: string;
  cnpj: string;
  industrySector: string;
  companyType: 'buyer' | 'supplier' | 'both';
}

export interface AuthResponse {
  token: string;
  user: any; // Will be properly typed as Company
}

// Backend-specific types that are not shared with frontend

export interface ProductCSVRow {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: {
    row: number;
    data: ProductCSVRow;
    error: string;
  }[];
}
