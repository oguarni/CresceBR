/**
 * Draft state for a supplier's response to a quotation request.
 *
 * The updaters here are pure and return new objects rather than editing the
 * draft in place. The previous inline versions copied the items array but then
 * assigned into the copied element — `items[i].unitPrice = x` — which mutated
 * the very object still referenced by the current state. That makes any
 * reference-equality check (React.memo, useMemo deps) see "no change" and is the
 * kind of aliasing bug that only shows up once a component is memoised.
 */

import { Quotation } from '@shared/types';

export interface QuotationResponseItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadTime: number;
  availability: string;
  notes?: string;
}

export interface QuotationResponseDraft {
  quotationId: number;
  items: QuotationResponseItem[];
  totalAmount: number;
  validUntil: string;
  deliveryTerms: string;
  paymentTerms: string;
  notes: string;
}

/** Editable text fields on the draft, excluding the item table and totals. */
export type QuotationResponseTextField = 'validUntil' | 'deliveryTerms' | 'paymentTerms' | 'notes';

const DEFAULT_LEAD_TIME_DAYS = 7;
const QUOTE_VALIDITY_DAYS = 30;

export const EMPTY_QUOTATION_RESPONSE: QuotationResponseDraft = {
  quotationId: 0,
  items: [],
  totalAmount: 0,
  validUntil: '',
  deliveryTerms: '',
  paymentTerms: '',
  notes: '',
};

const sumTotals = (items: QuotationResponseItem[]): number =>
  items.reduce((sum, item) => sum + item.totalPrice, 0);

const isoDateInDays = (days: number): string =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

/**
 * Seeds a response draft from the requested quotation, pre-filling each line
 * with the product's own catalogue price so the supplier only edits what differs.
 *
 * @example
 * const draft = buildResponseDraft(quotation); // draft.totalAmount is already summed
 */
export const buildResponseDraft = (quotation: Quotation): QuotationResponseDraft => {
  const items: QuotationResponseItem[] =
    quotation.items?.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.product?.unitPrice || 0,
      totalPrice: (item.product?.unitPrice || 0) * item.quantity,
      leadTime: item.product?.leadTime || DEFAULT_LEAD_TIME_DAYS,
      availability: item.product?.availability || 'in_stock',
      notes: '',
    })) || [];

  return {
    quotationId: quotation.id,
    items,
    totalAmount: sumTotals(items),
    // Incoterm and payment-term defaults are industry shorthand, not UI copy.
    validUntil: isoDateInDays(QUOTE_VALIDITY_DAYS),
    deliveryTerms: 'FOB Origin',
    paymentTerms: 'Net 30',
    notes: '',
  };
};

/** Returns a new draft with one line repriced and the total re-summed. */
export const withItemPrice = (
  draft: QuotationResponseDraft,
  index: number,
  unitPrice: number
): QuotationResponseDraft => {
  const items = draft.items.map((item, i) =>
    i === index ? { ...item, unitPrice, totalPrice: unitPrice * item.quantity } : item
  );

  return { ...draft, items, totalAmount: sumTotals(items) };
};

/** Returns a new draft with one line's availability changed. */
export const withItemAvailability = (
  draft: QuotationResponseDraft,
  index: number,
  availability: string
): QuotationResponseDraft => ({
  ...draft,
  items: draft.items.map((item, i) => (i === index ? { ...item, availability } : item)),
});
