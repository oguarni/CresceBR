import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Order, Quotation } from '@shared/types';
import { quotationsService } from '../services/quotationsService';
import { ordersService } from '../services/ordersService';
import { useT } from '../contexts/LanguageContext';
import { browserLogger } from '../utils/browserLogger';
import {
  buildDashboardMetrics,
  EMPTY_DASHBOARD_METRICS,
  isActiveOrder,
  isPendingQuote,
  MAX_PENDING_QUOTES,
  MAX_RECENT_ORDERS,
  type DashboardMetrics,
} from '../utils/supplierDashboard';

interface UseSupplierDashboardResult {
  metrics: DashboardMetrics;
  pendingQuotes: Quotation[];
  recentOrders: Order[];
  loading: boolean;
}

/**
 * Loads the supplier dashboard's two feeds in parallel and derives its metrics.
 *
 * The counts come from the full result sets while the lists are truncated for
 * display, so the badge can read "12 pending" beside only four rows.
 *
 * @example
 * const { metrics, pendingQuotes, recentOrders } = useSupplierDashboard();
 */
export const useSupplierDashboard = (): UseSupplierDashboardResult => {
  const t = useT();
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_DASHBOARD_METRICS);
  const [pendingQuotes, setPendingQuotes] = useState<Quotation[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Supplier-scoped endpoint: the quotations endpoint already returns only
      // quotations that include this supplier's products (filtered server-side).
      const [quotes, ordersResult] = await Promise.all([
        quotationsService.getSupplierQuotations(),
        ordersService.getUserOrders(),
      ]);

      const pending = quotes.filter(isPendingQuote);
      setPendingQuotes(pending.slice(0, MAX_PENDING_QUOTES));
      setRecentOrders(ordersResult.orders.filter(isActiveOrder).slice(0, MAX_RECENT_ORDERS));
      setMetrics(buildDashboardMetrics(ordersResult.orders, pending));
    } catch (error) {
      browserLogger.error('Failed to load dashboard data', { error });
      toast.error(t('supplierDashboard.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  return { metrics, pendingQuotes, recentOrders, loading };
};
