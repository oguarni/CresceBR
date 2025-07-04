import Product from '../models/Product';
import QuotationItem from '../models/QuotationItem';
import Quotation from '../models/Quotation';

interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  discount: number;
}

interface QuoteCalculationInput {
  productId: number;
  quantity: number;
  buyerLocation?: string;
  supplierLocation?: string;
  shippingMethod?: 'standard' | 'express' | 'economy';
}

interface QuoteCalculationResult {
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

interface QuoteComparisonResult {
  items: QuoteCalculationResult[];
  totalSubtotal: number;
  totalShipping: number;
  totalTax: number;
  grandTotal: number;
  totalSavings: number;
}

export class QuoteService {
  private static readonly DEFAULT_PRICING_TIERS: PricingTier[] = [
    { minQuantity: 1, maxQuantity: 10, discount: 0 },
    { minQuantity: 11, maxQuantity: 50, discount: 0.05 },
    { minQuantity: 51, maxQuantity: 100, discount: 0.1 },
    { minQuantity: 101, maxQuantity: 500, discount: 0.15 },
    { minQuantity: 501, maxQuantity: null, discount: 0.2 },
  ];

  private static readonly SHIPPING_RATES = {
    standard: { baseRate: 50, perKgRate: 2.5, deliveryDays: 5 },
    express: { baseRate: 100, perKgRate: 5.0, deliveryDays: 2 },
    economy: { baseRate: 25, perKgRate: 1.5, deliveryDays: 10 },
  };

  private static readonly TAX_RATE = 0.18;

  static getPricingTier(quantity: number, customTiers?: PricingTier[]): PricingTier | null {
    const tiers = customTiers || this.DEFAULT_PRICING_TIERS;

    for (const tier of tiers) {
      if (
        quantity >= tier.minQuantity &&
        (tier.maxQuantity === null || quantity <= tier.maxQuantity)
      ) {
        return tier;
      }
    }

    return null;
  }

  static calculateShippingCost(
    quantity: number,
    shippingMethod: 'standard' | 'express' | 'economy' = 'standard',
    distance: number = 100
  ): number {
    const rates = this.SHIPPING_RATES[shippingMethod];
    const estimatedWeight = quantity * 0.5;
    const distanceMultiplier = Math.max(1, distance / 100);

    return (rates.baseRate + estimatedWeight * rates.perKgRate) * distanceMultiplier;
  }

  static calculateDistanceBetweenCities(city1?: string, city2?: string): number {
    if (!city1 || !city2) return 100;

    const distances: { [key: string]: { [key: string]: number } } = {
      Curitiba: { Londrina: 380, Maringá: 430, Cascavel: 500, 'Foz do Iguaçu': 640 },
      Londrina: { Curitiba: 380, Maringá: 120, Cascavel: 380, 'Foz do Iguaçu': 490 },
      Maringá: { Curitiba: 430, Londrina: 120, Cascavel: 280, 'Foz do Iguaçu': 370 },
      Cascavel: { Curitiba: 500, Londrina: 380, Maringá: 280, 'Foz do Iguaçu': 140 },
      'Foz do Iguaçu': { Curitiba: 640, Londrina: 490, Maringá: 370, Cascavel: 140 },
    };

    return distances[city1]?.[city2] || 100;
  }

  static async calculateQuoteForItem(
    input: QuoteCalculationInput
  ): Promise<QuoteCalculationResult> {
    const product = await Product.findByPk(input.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const basePrice = parseFloat(product.price.toString());
    const appliedTier = this.getPricingTier(input.quantity);
    const tierDiscount = appliedTier ? appliedTier.discount : 0;
    const unitPriceAfterDiscount = basePrice * (1 - tierDiscount);
    const subtotal = unitPriceAfterDiscount * input.quantity;

    const distance = this.calculateDistanceBetweenCities(
      input.buyerLocation,
      input.supplierLocation
    );
    const shippingCost = this.calculateShippingCost(input.quantity, input.shippingMethod, distance);

    const tax = subtotal * this.TAX_RATE;
    const total = subtotal + shippingCost + tax;
    const savings = basePrice * input.quantity - subtotal;

    return {
      productId: input.productId,
      basePrice,
      quantity: input.quantity,
      tierDiscount,
      unitPriceAfterDiscount,
      subtotal,
      shippingCost,
      tax,
      total,
      savings,
      appliedTier,
    };
  }

  static async calculateQuoteComparison(
    items: QuoteCalculationInput[],
    options: {
      buyerLocation?: string;
      supplierLocation?: string;
      shippingMethod?: 'standard' | 'express' | 'economy';
    } = {}
  ): Promise<QuoteComparisonResult> {
    const calculatedItems = await Promise.all(
      items.map(item =>
        this.calculateQuoteForItem({
          ...item,
          buyerLocation: options.buyerLocation,
          supplierLocation: options.supplierLocation,
          shippingMethod: options.shippingMethod,
        })
      )
    );

    const totalSubtotal = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalShipping = calculatedItems.reduce((sum, item) => sum + item.shippingCost, 0);
    const totalTax = calculatedItems.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = totalSubtotal + totalShipping + totalTax;
    const totalSavings = calculatedItems.reduce((sum, item) => sum + item.savings, 0);

    return {
      items: calculatedItems,
      totalSubtotal,
      totalShipping,
      totalTax,
      grandTotal,
      totalSavings,
    };
  }

  static async updateQuotationWithCalculations(
    quotationId: number,
    calculations: QuoteComparisonResult
  ): Promise<void> {
    const quotation = await Quotation.findByPk(quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    await quotation.update({
      status: 'processed',
      adminNotes: `Quote calculated - Total: R$ ${calculations.grandTotal.toFixed(2)}, Savings: R$ ${calculations.totalSavings.toFixed(2)}`,
    });
  }

  static async getQuotationWithCalculations(quotationId: number): Promise<{
    quotation: Quotation;
    calculations: QuoteComparisonResult;
  }> {
    const quotation = await Quotation.findByPk(quotationId, {
      include: [
        {
          model: QuotationItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
            },
          ],
        },
      ],
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const items = (quotation as any).items || [];
    const calculationInputs: QuoteCalculationInput[] = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const calculations = await this.calculateQuoteComparison(calculationInputs);

    return {
      quotation,
      calculations,
    };
  }

  static formatQuoteResponse(calculations: QuoteComparisonResult): {
    summary: {
      totalItems: number;
      subtotal: string;
      shipping: string;
      tax: string;
      total: string;
      savings: string;
    };
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: string;
      discount: string;
      subtotal: string;
      appliedTier: string;
    }>;
  } {
    return {
      summary: {
        totalItems: calculations.items.length,
        subtotal: `R$ ${calculations.totalSubtotal.toFixed(2)}`,
        shipping: `R$ ${calculations.totalShipping.toFixed(2)}`,
        tax: `R$ ${calculations.totalTax.toFixed(2)}`,
        total: `R$ ${calculations.grandTotal.toFixed(2)}`,
        savings: `R$ ${calculations.totalSavings.toFixed(2)}`,
      },
      items: calculations.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: `R$ ${item.unitPriceAfterDiscount.toFixed(2)}`,
        discount: `${(item.tierDiscount * 100).toFixed(1)}%`,
        subtotal: `R$ ${item.subtotal.toFixed(2)}`,
        appliedTier: item.appliedTier
          ? `${item.appliedTier.minQuantity}${item.appliedTier.maxQuantity ? `-${item.appliedTier.maxQuantity}` : '+'} units`
          : 'No tier applied',
      })),
    };
  }
}
