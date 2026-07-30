/**
 * Status and urgency classification for supplier quotations.
 *
 * Extracted from SupplierQuotationsPage so the page, its cards and its dialogs
 * all classify a quotation the same way. Every function here is pure and takes
 * `t` as a parameter rather than calling `useT()`, which keeps them usable
 * outside a component and directly unit-testable.
 */

import type { Translate } from '../contexts/LanguageContext';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export const QUOTATION_STATUSES = ['pending', 'processed', 'completed', 'rejected'] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const isQuotationStatus = (status: string): status is QuotationStatus =>
  (QUOTATION_STATUSES as readonly string[]).includes(status);

/**
 * Tab order in the supplier queue UI.
 *
 * Indexes into the grouped quotations and into the
 * `supplierQuotations.empty.*` / `.tabs.*` dictionary sections, so this array's
 * order and the Tabs render order must stay in sync.
 */
export const TAB_KEYS = ['all', 'pending', 'processed', 'completed', 'rejected'] as const;

export type QuotationTabKey = (typeof TAB_KEYS)[number];

/**
 * Renders a quotation status in the active language, falling back to the raw
 * value so an unrecognised status from the API still shows something useful.
 *
 * @example
 * translateStatus(t, 'pending'); // 'Pendente' under pt
 */
export const translateStatus = (t: Translate, status: string): string =>
  isQuotationStatus(status) ? t(`supplierQuotations.status.${status}`) : status;

export const getStatusColor = (status: string): ChipColor => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'processed':
      return 'info';
    case 'completed':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

export type PriorityKey = 'none' | 'urgent' | 'high' | 'medium' | 'low';

const daysUntil = (date: Date | string): number => {
  const delivery = new Date(date);
  return Math.ceil((delivery.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

/**
 * Classifies a quotation's urgency from its requested delivery date.
 *
 * Returns a stable, language-independent key. The priority filter compares
 * against this key, so it must never be replaced by a translated label —
 * doing so silently breaks filtering in any non-English locale.
 *
 * @example
 * getPriorityKey(new Date(Date.now() + 3 * 864e5)); // 'urgent'
 */
export const getPriorityKey = (requestedDeliveryDate?: Date): PriorityKey => {
  if (!requestedDeliveryDate) return 'none';

  const daysDiff = daysUntil(requestedDeliveryDate);

  if (daysDiff < 7) return 'urgent';
  if (daysDiff < 14) return 'high';
  if (daysDiff < 30) return 'medium';
  return 'low';
};

const PRIORITY_COLORS: Record<PriorityKey, ChipColor> = {
  none: 'default',
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

export const getPriorityColor = (requestedDeliveryDate?: Date): ChipColor =>
  PRIORITY_COLORS[getPriorityKey(requestedDeliveryDate)];
