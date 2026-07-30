import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Quotation } from '@shared/types';
import { quotationsService } from '../services/quotationsService';
import { useT } from '../contexts/LanguageContext';
import { browserLogger } from '../utils/browserLogger';

interface UseSupplierQuotationsResult {
  quotations: Quotation[];
  loading: boolean;
  reload: () => Promise<void>;
  acceptQuotation: (quotationId: number) => Promise<void>;
  rejectQuotation: (quotationId: number, reason: string) => Promise<void>;
  submitResponse: (quotationId: number, notes: string) => Promise<boolean>;
}

/**
 * Loads the supplier's quotation queue and exposes its status transitions.
 *
 * Every mutation reloads the list rather than patching local state, so the
 * displayed status always reflects what the server accepted.
 *
 * `submitResponse` returns whether the call succeeded, letting the caller close
 * its dialog only on success instead of discarding a draft the server rejected.
 *
 * @example
 * const { quotations, loading, acceptQuotation } = useSupplierQuotations();
 */
export const useSupplierQuotations = (): UseSupplierQuotationsResult => {
  const t = useT();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // Supplier-scoped endpoint: the backend already restricts results to
      // quotations that include this supplier's products.
      const data = await quotationsService.getSupplierQuotations();
      setQuotations(data);
    } catch (error) {
      browserLogger.error('Failed to load quotations', { error });
      toast.error(t('supplierQuotations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const acceptQuotation = useCallback(
    async (quotationId: number) => {
      try {
        await quotationsService.updateSupplierQuotation(quotationId, { status: 'completed' });
        toast.success(t('supplierQuotations.acceptSuccess'));
        await reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('supplierQuotations.acceptError'));
      }
    },
    [reload, t]
  );

  const rejectQuotation = useCallback(
    async (quotationId: number, reason: string) => {
      try {
        await quotationsService.updateSupplierQuotation(quotationId, {
          status: 'rejected',
          adminNotes: reason,
        });
        toast.success(t('supplierQuotations.rejectSuccess'));
        await reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('supplierQuotations.rejectError'));
      }
    },
    [reload, t]
  );

  const submitResponse = useCallback(
    async (quotationId: number, notes: string): Promise<boolean> => {
      try {
        await quotationsService.updateSupplierQuotation(quotationId, {
          status: 'processed',
          adminNotes: notes || undefined,
        });
        toast.success(t('supplierQuotations.submitSuccess'));
        await reload();
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('supplierQuotations.submitError'));
        return false;
      }
    },
    [reload, t]
  );

  return { quotations, loading, reload, acceptQuotation, rejectQuotation, submitResponse };
};
