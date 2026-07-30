import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useT } from '../contexts/LanguageContext';
import type { Company, VerificationFilter, VerificationQueue } from '../utils/companyVerification';

const QUEUE_PAGE_SIZE = 10;

interface UseCompanyVerificationQueueResult {
  queue: VerificationQueue | null;
  loading: boolean;
  error: string;
  filter: VerificationFilter;
  setFilter: (filter: VerificationFilter) => void;
  reload: () => Promise<void>;
  verifyCompany: (
    companyId: number,
    status: 'approved' | 'rejected',
    reason: string
  ) => Promise<void>;
  validateCnpj: (companyId: number) => Promise<Company | null>;
  cnpjValidating: boolean;
}

/**
 * Loads the admin verification queue and exposes its two write operations.
 *
 * Changing the filter resets to the first page, since a page number from one
 * filter is meaningless under another.
 *
 * `validateCnpj` returns the refreshed company so the caller can update whatever
 * it currently has selected, instead of the hook reaching into the caller's state.
 *
 * @example
 * const { queue, loading, verifyCompany } = useCompanyVerificationQueue();
 */
export const useCompanyVerificationQueue = (): UseCompanyVerificationQueueResult => {
  const t = useT();
  const [queue, setQueue] = useState<VerificationQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilterState] = useState<VerificationFilter>('pending');
  const [page, setPage] = useState(1);
  const [cnpjValidating, setCnpjValidating] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = (await authService.adminRequest('/admin/companies/queue', {
        params: { page: String(page), limit: String(QUEUE_PAGE_SIZE), filter },
      })) as { data: unknown };

      setQueue(response.data as VerificationQueue);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('companyVerification.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, filter, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setFilter = useCallback((next: VerificationFilter) => {
    setFilterState(next);
    setPage(1);
  }, []);

  const verifyCompany = useCallback(
    async (companyId: number, status: 'approved' | 'rejected', reason: string) => {
      try {
        const response = (await authService.adminRequest(`/admin/companies/${companyId}/verify`, {
          method: 'PUT',
          data: { status, reason: reason || undefined, validateCNPJ: status === 'approved' },
        })) as { data: { message: string } };

        toast.success(response.data.message);
        await reload();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t('companyVerification.toast.verifyError')
        );
      }
    },
    [reload, t]
  );

  const validateCnpj = useCallback(
    async (companyId: number): Promise<Company | null> => {
      setCnpjValidating(true);
      try {
        const response = (await authService.adminRequest(
          `/admin/companies/${companyId}/validate-cnpj`,
          { method: 'POST' }
        )) as { data: { user: Company } };

        toast.success(t('companyVerification.toast.cnpjValidated'));
        await reload();
        return response.data.user;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('companyVerification.toast.cnpjError'));
        return null;
      } finally {
        setCnpjValidating(false);
      }
    },
    [reload, t]
  );

  return {
    queue,
    loading,
    error,
    filter,
    setFilter,
    reload,
    verifyCompany,
    validateCnpj,
    cnpjValidating,
  };
};
