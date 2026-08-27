/**
 * Quote pricing for the browser-side demo API.
 *
 * A direct port of `backend/src/services/quoteService.ts`. The constants and the
 * order of operations are kept identical so the hosted demo quotes the same
 * numbers a real deployment would; change this file only to track that service.
 */

import type { PricingTier, Product } from '@shared/types';

export type ShippingMethod = 'standard' | 'express' | 'economy';

export interface QuoteCalculationResult {
  productId: number;
  basePrice: number;
  quantity: number;
  tierDiscount: number;
  unitPriceAfterDiscount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  savings: number;
  appliedTier: PricingTier | null;
}

export interface QuoteComparisonResult {
  items: QuoteCalculationResult[];
  totalSubtotal: number;
  totalShipping: number;
  totalTax: number;
  grandTotal: number;
  totalSavings: number;
}

const DEFAULT_PRICING_TIERS: PricingTier[] = [
  { minQuantity: 1, maxQuantity: 10, discount: 0 },
  { minQuantity: 11, maxQuantity: 50, discount: 0.05 },
  { minQuantity: 51, maxQuantity: 100, discount: 0.1 },
  { minQuantity: 101, maxQuantity: 500, discount: 0.15 },
  { minQuantity: 501, maxQuantity: null, discount: 0.2 },
];

const SHIPPING_RATES: Record<ShippingMethod, { baseRate: number; perKgRate: number }> = {
  standard: { baseRate: 50, perKgRate: 2.5 },
  express: { baseRate: 100, perKgRate: 5.0 },
  economy: { baseRate: 25, perKgRate: 1.5 },
};

const TAX_RATE = 0.18;

const CITY_DISTANCES: Record<string, Record<string, number>> = {
  Curitiba: { Londrina: 380, Maringá: 430, Cascavel: 500, 'Foz do Iguaçu': 640 },
  Londrina: { Curitiba: 380, Maringá: 120, Cascavel: 380, 'Foz do Iguaçu': 490 },
  Maringá: { Curitiba: 430, Londrina: 120, Cascavel: 280, 'Foz do Iguaçu': 370 },
  Cascavel: { Curitiba: 500, Londrina: 380, Maringá: 280, 'Foz do Iguaçu': 140 },
  'Foz do Iguaçu': { Curitiba: 640, Londrina: 490, Maringá: 370, Cascavel: 140 },
};

export const getPricingTier = (
  quantity: number,
  customTiers?: PricingTier[]
): PricingTier | null => {
  const tiers = customTiers || DEFAULT_PRICING_TIERS;

  for (const tier of tiers) {
    if (quantity >= tier.minQuantity && (tier.maxQuantity === null || quantity <= tier.maxQuantity))
      return tier;
  }

  return null;
};

export const calculateShippingCost = (
  quantity: number,
  shippingMethod: ShippingMethod = 'standard',
  distance = 100
): number => {
  const rates = SHIPPING_RATES[shippingMethod];
  const estimatedWeight = quantity * 0.5;
  const distanceMultiplier = Math.max(1, distance / 100);

  return (rates.baseRate + estimatedWeight * rates.perKgRate) * distanceMultiplier;
};

export const calculateDistanceBetweenCities = (city1?: string, city2?: string): number => {
  if (!city1 || !city2) return 100;
  return CITY_DISTANCES[city1]?.[city2] || 100;
};

/**
 * Prices one line item. Throws below the product's minimum order quantity,
 * matching the backend's validation so the demo surfaces the same error.
 */
export const calculateQuoteForItem = (
  product: Product,
  quantity: number,
  options: {
    buyerLocation?: string;
    supplierLocation?: string;
    shippingMethod?: ShippingMethod;
  } = {}
): QuoteCalculationResult => {
  if (product.minimumOrderQuantity && quantity < product.minimumOrderQuantity) {
    throw new Error(`Minimum order quantity is ${product.minimumOrderQuantity} units`);
  }

  const basePrice = product.unitPrice ? Number(product.unitPrice) : Number(product.price);

  // An empty tierPricing array is truthy, so it suppresses the defaults and
  // yields no discount — the backend behaves the same way.
  const customTiers = product.tierPricing ? product.tierPricing : undefined;
  const appliedTier = getPricingTier(quantity, customTiers);
  const tierDiscount = appliedTier ? appliedTier.discount : 0;
  const unitPriceAfterDiscount = basePrice * (1 - tierDiscount);
  const subtotal = unitPriceAfterDiscount * quantity;

  const distance = calculateDistanceBetweenCities(options.buyerLocation, options.supplierLocation);
  const shippingCost = calculateShippingCost(quantity, options.shippingMethod, distance);

  const tax = subtotal * TAX_RATE;

  return {
    productId: product.id,
    basePrice,
    quantity,
    tierDiscount,
    unitPriceAfterDiscount,
    subtotal,
    shippingCost,
    tax,
    total: subtotal + shippingCost + tax,
    savings: basePrice * quantity - subtotal,
    appliedTier,
  };
};

export const calculateQuoteComparison = (
  items: QuoteCalculationResult[]
): QuoteComparisonResult => {
  const sum = (pick: (item: QuoteCalculationResult) => number): number =>
    items.reduce((acc, item) => acc + pick(item), 0);

  return {
    items,
    totalSubtotal: sum(i => i.subtotal),
    totalShipping: sum(i => i.shippingCost),
    totalTax: sum(i => i.tax),
    grandTotal: sum(i => i.total),
    totalSavings: sum(i => i.savings),
  };
};
