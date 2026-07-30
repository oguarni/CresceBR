/**
 * Types and pure helpers for the admin company-verification queue.
 *
 * Label lookups take the translator as a parameter rather than calling the hook,
 * so they stay usable from plain functions and from tests without a provider.
 */

import type { Translate } from '../contexts/LanguageContext';

export interface Company {
  id: number;
  email: string;
  cpf: string;
  companyName: string;
  corporateName: string;
  cnpj: string;
  cnpjValidated: boolean;
  industrySector: string;
  companyType: 'buyer' | 'supplier' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  contactPerson?: string;
  contactTitle?: string;
  companySize?: string;
  annualRevenue?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationQueue {
  companies: Company[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const INDUSTRY_SECTORS = [
  'machinery',
  'raw_materials',
  'components',
  'electronics',
  'textiles',
  'chemicals',
  'automotive',
  'food_beverage',
  'construction',
  'pharmaceutical',
  'other',
] as const;

const COMPANY_TYPES = ['buyer', 'supplier', 'both'] as const;

type IndustrySector = (typeof INDUSTRY_SECTORS)[number];
type CompanyType = (typeof COMPANY_TYPES)[number];

const isIndustrySector = (value: string): value is IndustrySector =>
  (INDUSTRY_SECTORS as readonly string[]).includes(value);

const isCompanyType = (value: string): value is CompanyType =>
  (COMPANY_TYPES as readonly string[]).includes(value);

/** Server-side queue filters, indexed by tab position. */
export const VERIFICATION_FILTERS = ['pending', 'all', 'unvalidated_cnpj'] as const;

export type VerificationFilter = (typeof VERIFICATION_FILTERS)[number];

/**
 * Sector and company-type labels live in the register.* dictionary sections;
 * resolving through t() keeps a single source of truth for both screens. An
 * unrecognised value falls through to itself rather than rendering a raw key.
 *
 * @example
 * sectorLabel(t, 'electronics'); // 'Eletrônicos'
 */
export const sectorLabel = (t: Translate, sector: string): string =>
  isIndustrySector(sector) ? t(`register.industry.${sector}`) : sector;

/** @example companyTypeLabel(t, 'supplier'); // 'Fornecedor' */
export const companyTypeLabel = (t: Translate, type: string): string =>
  isCompanyType(type) ? t(`register.companyType.${type}`) : type;

/**
 * Client-side filter over the loaded page: matches the company name
 * (case-insensitive) or the CNPJ ignoring punctuation. An empty term matches
 * everything, so callers need no special case for the unfiltered view.
 *
 * @example
 * matchesCompanySearch(company, '12.345'); // true when the CNPJ contains 12345
 */
export const matchesCompanySearch = (company: Company, searchTerm: string): boolean => {
  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized) return true;

  if (company.companyName.toLowerCase().includes(normalized)) return true;

  const digits = normalized.replace(/\D/g, '');
  return digits.length > 0 && company.cnpj.replace(/\D/g, '').includes(digits);
};

/** Queue timestamps are shown in pt-BR regardless of UI language, matching the CNPJ/CEP formats beside them. */
export const formatVerificationDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
