/**
 * Form shape, filtering and status rules for the supplier's product catalogue.
 */

import type { Product } from '@shared/types';

export const PRODUCT_AVAILABILITIES = [
  'in_stock',
  'limited',
  'out_of_stock',
  'custom_order',
] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITIES)[number];

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  unitPrice: number;
  minimumOrderQuantity: number;
  leadTime: number;
  availability: ProductAvailability;
  specifications: Record<string, string>;
  tierPricing: Array<{
    minQuantity: number;
    maxQuantity: number | null;
    discount: number;
  }>;
}

const DEFAULT_LEAD_TIME_DAYS = 7;

export const EMPTY_PRODUCT_FORM: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  category: '',
  unitPrice: 0,
  minimumOrderQuantity: 1,
  leadTime: DEFAULT_LEAD_TIME_DAYS,
  availability: 'in_stock',
  specifications: {},
  tierPricing: [],
};

/**
 * Seeds the edit form from an existing product, defaulting the two optional
 * collections so the form never has to handle undefined.
 *
 * @example
 * setFormData(productFormFromProduct(product));
 */
export const productFormFromProduct = (product: Product): ProductFormData => ({
  name: product.name,
  description: product.description,
  price: product.price,
  imageUrl: product.imageUrl,
  category: product.category,
  unitPrice: product.unitPrice,
  minimumOrderQuantity: product.minimumOrderQuantity,
  leadTime: product.leadTime,
  availability: product.availability,
  specifications: (product.specifications as Record<string, string>) || {},
  tierPricing: product.tierPricing || [],
});

export type ChipColor = 'success' | 'warning' | 'error' | 'info' | 'default';

const AVAILABILITY_COLORS: Record<ProductAvailability, ChipColor> = {
  in_stock: 'success',
  limited: 'warning',
  out_of_stock: 'error',
  custom_order: 'info',
};

/** @example availabilityColor('limited'); // 'warning' */
export const availabilityColor = (availability: string): ChipColor =>
  AVAILABILITY_COLORS[availability as ProductAvailability] ?? 'default';

export interface ProductFilters {
  searchTerm: string;
  category: string;
  availability: string;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  searchTerm: '',
  category: '',
  availability: '',
};

/**
 * Matches on name or description, case-insensitively, and narrows by the two
 * dropdowns. Empty filter values match everything.
 *
 * @example
 * products.filter(p => matchesProductFilters(p, filters));
 */
export const matchesProductFilters = (product: Product, filters: ProductFilters): boolean => {
  const term = filters.searchTerm.toLowerCase();
  const matchesSearch =
    product.name.toLowerCase().includes(term) || product.description.toLowerCase().includes(term);

  if (!matchesSearch) return false;
  if (filters.category && product.category !== filters.category) return false;
  return !filters.availability || product.availability === filters.availability;
};

/** Tab order; the index into this array is the selected tab. */
export const PRODUCT_TAB_KEYS = ['all', 'active', 'outOfStock'] as const;

export type ProductTabKey = (typeof PRODUCT_TAB_KEYS)[number];

/**
 * Buckets the filtered catalogue for the tabs. "Active" is everything still
 * orderable, which includes limited stock and made-to-order items.
 *
 * @example
 * groupProductsByStock(filtered).outOfStock.length;
 */
export const groupProductsByStock = (products: Product[]): Record<ProductTabKey, Product[]> => ({
  all: products,
  active: products.filter(product => product.availability !== 'out_of_stock'),
  outOfStock: products.filter(product => product.availability === 'out_of_stock'),
});
