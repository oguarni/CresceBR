import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Refresh, Search } from '@mui/icons-material';
import { useT } from '../contexts/LanguageContext';
import { useCompanyVerificationQueue } from '../hooks/useCompanyVerificationQueue';
import { CompanyVerificationStats } from '../components/CompanyVerificationStats';
import { CompanyQueueItem } from '../components/CompanyQueueItem';
import { CompanyDetailsDialog } from '../components/CompanyDetailsDialog';
import { CompanyVerificationDialog } from '../components/CompanyVerificationDialog';
import {
  matchesCompanySearch,
  VERIFICATION_FILTERS,
  type Company,
} from '../utils/companyVerification';

const TAB_LABEL_KEYS = [
  'companyVerification.tabs.pending',
  'companyVerification.tabs.all',
  'companyVerification.tabs.invalidCnpj',
] as const;

/**
 * Admin screen for reviewing company registrations: a server-filtered queue with
 * client-side search, plus dialogs for inspecting a company and deciding on it.
 *
 * Data access lives in `useCompanyVerificationQueue`, the filter and label rules
 * in `utils/companyVerification`, and each UI block in its own component.
 */
const AdminCompanyVerificationPage: React.FC = () => {
  const t = useT();
  const { queue, loading, error, setFilter, reload, verifyCompany, validateCnpj, cnpjValidating } =
    useCompanyVerificationQueue();

  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [verificationReason, setVerificationReason] = useState('');

  const visibleCompanies = (queue?.companies ?? []).filter(company =>
    matchesCompanySearch(company, searchTerm)
  );

  const handleTabChange = (tabIndex: number) => {
    setCurrentTab(tabIndex);
    setFilter(VERIFICATION_FILTERS[tabIndex]);
  };

  const handleDecision = async (company: Company, status: 'approved' | 'rejected') => {
    setSelectedCompany(company);
    await verifyCompany(company.id, status, verificationReason);
    setVerificationDialog(false);
    setVerificationReason('');
    setSelectedCompany(null);
  };

  const handleValidateCnpj = async (companyId: number) => {
    const updated = await validateCnpj(companyId);
    // Refresh the open dialog in place so the CNPJ badge flips without reopening it.
    if (updated && selectedCompany?.id === companyId) setSelectedCompany(updated);
  };

  const handleViewDetails = (company: Company) => {
    setSelectedCompany(company);
    setDetailsDialog(true);
  };

  if (loading && !queue) {
    return (
      <Container maxWidth='lg'>
        <Box display='flex' justifyContent='center' alignItems='center' minHeight='50vh'>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg'>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h4' component='h1'>
            {t('companyVerification.title')}
          </Typography>
          <Button
            variant='outlined'
            startIcon={<Refresh />}
            onClick={() => reload()}
            disabled={loading}
          >
            {t('companyVerification.refresh')}
          </Button>
        </Box>
        <Typography variant='body1' color='text.secondary'>
          {t('companyVerification.subtitle')}
        </Typography>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {queue && <CompanyVerificationStats />}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant='h6'
            sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {t('companyVerification.queueTitle')}
            <Chip
              label={t('companyVerification.companyCount', { count: queue?.totalCount || 0 })}
              size='small'
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.main',
                fontWeight: 'bold',
                height: 20,
                fontSize: '0.75rem',
              }}
            />
          </Typography>
        </Box>

        {/* Tab order mirrors VERIFICATION_FILTERS, so the two cannot drift apart. */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => handleTabChange(newValue)}>
            {TAB_LABEL_KEYS.map(key => (
              <Tab key={key} label={t(key)} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size='small'
            placeholder={t('companyVerification.searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search fontSize='small' />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading && !queue?.companies.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : visibleCompanies.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('companyVerification.emptyQueue')}
            </Typography>
          ) : (
            visibleCompanies.map(company => (
              <CompanyQueueItem
                key={company.id}
                company={company}
                onApprove={c => handleDecision(c, 'approved')}
                onReject={c => handleDecision(c, 'rejected')}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </Box>
      </Box>

      {queue && queue.totalPages > 1 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            {t('companyVerification.pagination', {
              current: queue.currentPage,
              total: queue.totalPages,
            })}
          </Typography>
        </Box>
      )}

      <CompanyDetailsDialog
        open={detailsDialog}
        company={selectedCompany}
        cnpjValidating={cnpjValidating}
        onClose={() => setDetailsDialog(false)}
        onValidateCnpj={handleValidateCnpj}
        onVerify={() => {
          setDetailsDialog(false);
          setVerificationDialog(true);
        }}
      />

      <CompanyVerificationDialog
        open={verificationDialog}
        company={selectedCompany}
        reason={verificationReason}
        onReasonChange={setVerificationReason}
        onClose={() => setVerificationDialog(false)}
        onDecide={status => selectedCompany && handleDecision(selectedCompany, status)}
      />
    </Container>
  );
};

export default AdminCompanyVerificationPage;
