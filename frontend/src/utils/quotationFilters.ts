/**
 * Filter predicate for the supplier quotation queue.
 *
 * Pure and separate from the UI so the matching rules can be unit-tested
 * directly, without rendering the page or driving four MUI selects.
 */

import { Quotation } from '@shared/types';
import { getPriorityKey } from './quotationStatus';

export interface QuotationFilters {
  searchTerm: string;
  status: string;
  priority: string;
  dateRange: string;
}

export const EMPTY_QUOTATION_FILTERS: QuotationFilters = {
  searchTerm: '',
  status: '',
  priority: '',
  dateRange: '',
};

/** Whole days elapsed since `date`. Negative for future dates. */
const daysSince = (date: Date | string): number =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

const MAX_AGE_DAYS: Record<string, number> = {
  today: 0,
  week: 7,
  month: 30,
};

/**
 * An empty filter value means "no constraint", so each clause short-circuits to
 * true. An unrecognised `dateRange` is also treated as no constraint rather than
 * silently hiding every row.
 */
const matchesDateRange = (createdAt: Date | string, dateRange: string): boolean => {
  if (!dateRange) return true;

  const maxAge = MAX_AGE_DAYS[dateRange];
  if (maxAge === undefined) return true;

  const age = daysSince(createdAt);
  return maxAge === 0 ? age === 0 : age <= maxAge;
};

const matchesSearch = (quotation: Quotation, searchTerm: string): boolean =>
  Boolean(
    quotation.id.toString().includes(searchTerm) ||
    quotation.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

/**
 * True when a quotation satisfies every active filter.
 *
 * Priority is compared against the stable key from `getPriorityKey`, never a
 * translated label — comparing display text breaks filtering in any non-default
 * locale.
 *
 * @example
 * quotations.filter(q => matchesQuotationFilters(q, { ...EMPTY_QUOTATION_FILTERS, status: 'pending' }));
 */
export const matchesQuotationFilters = (
  quotation: Quotation,
  filters: QuotationFilters
): boolean => {
  if (!matchesSearch(quotation, filters.searchTerm)) return false;
  if (filters.status && quotation.status !== filters.status) return false;
  if (filters.priority && getPriorityKey(quotation.requestedDeliveryDate) !== filters.priority) {
    return false;
  }
  return matchesDateRange(quotation.createdAt!, filters.dateRange);
};

/** Groups quotations by status, plus an `all` bucket, for the tab counts. */
export const groupQuotationsByStatus = (quotations: Quotation[]) => ({
  pending: quotations.filter(q => q.status === 'pending'),
  processed: quotations.filter(q => q.status === 'processed'),
  completed: quotations.filter(q => q.status === 'completed'),
  rejected: quotations.filter(q => q.status === 'rejected'),
  all: quotations,
});
