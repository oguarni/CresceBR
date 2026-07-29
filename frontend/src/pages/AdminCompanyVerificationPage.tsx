import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from '@mui/material';
import {
  Verified,
  Pending,
  Visibility,
  Business,
  CheckCircle,
  Warning,
  ExpandMore,
  Refresh,
  Email,
  Phone,
  LocationOn,
  Category,
  Search,
  Close,
  Check,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { useT } from '../contexts/LanguageContext';

interface Company {
  id: number;
  email: string;
  cpf: string;
  companyName: string;
  corporateName: string;
  cnpj: string;
  cnpjValidated: boolean;
  industrySector: string;
  companyType: 'buyer' | 'supplier' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  contactPerson?: string;
  contactTitle?: string;
  companySize?: string;
  annualRevenue?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationQueue {
  companies: Company[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const INDUSTRY_SECTORS = [
  'machinery',
  'raw_materials',
  'components',
  'electronics',
  'textiles',
  'chemicals',
  'automotive',
  'food_beverage',
  'construction',
  'pharmaceutical',
  'other',
] as const;

const COMPANY_TYPES = ['buyer', 'supplier', 'both'] as const;

type IndustrySector = (typeof INDUSTRY_SECTORS)[number];
type CompanyType = (typeof COMPANY_TYPES)[number];

const isIndustrySector = (value: string): value is IndustrySector =>
  (INDUSTRY_SECTORS as readonly string[]).includes(value);

const isCompanyType = (value: string): value is CompanyType =>
  (COMPANY_TYPES as readonly string[]).includes(value);

const AdminCompanyVerificationPage: React.FC = () => {
  const t = useT();
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'unvalidated_cnpj'>('pending');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationReason, setVerificationReason] = useState('');
  const [cnpjValidating, setCnpjValidating] = useState(false);

  const loadVerificationQueue = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = (await authService.adminRequest('/admin/companies/queue', {
        params: {
          page: String(page),
          limit: '10',
          filter,
        },
      })) as { data: unknown };

      setVerificationQueue(response.data as Parameters<typeof setVerificationQueue>[0]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('companyVerification.toast.loadError');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, filter, t]);

  useEffect(() => {
    loadVerificationQueue();
  }, [loadVerificationQueue]);

  const handleVerifyCompany = async (companyId: number, status: 'approved' | 'rejected') => {
    try {
      const response = (await authService.adminRequest(`/admin/companies/${companyId}/verify`, {
        method: 'PUT',
        data: {
          status,
          reason: verificationReason || undefined,
          validateCNPJ: status === 'approved',
        },
      })) as { data: { message: string } };

      toast.success(response.data.message);
      setVerificationDialog(false);
      setVerificationReason('');
      setSelectedCompany(null);
      loadVerificationQueue();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('companyVerification.toast.verifyError');
      toast.error(errorMessage);
    }
  };

  const handleValidateCNPJ = async (companyId: number) => {
    setCnpjValidating(true);
    try {
      const response = (await authService.adminRequest(
        `/admin/companies/${companyId}/validate-cnpj`,
        {
          method: 'POST',
        }
      )) as { data: { user: Parameters<typeof setSelectedCompany>[0] } };

      toast.success(t('companyVerification.toast.cnpjValidated'));

      // Update the selected company data
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(response.data.user);
      }

      loadVerificationQueue();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('companyVerification.toast.cnpjError');
      toast.error(errorMessage);
    } finally {
      setCnpjValidating(false);
    }
  };

  // Sector and company-type labels live in the register.* dictionary sections;
  // resolving through t() keeps a single source of truth for both screens.
  const getSectorLabel = (sector: string) =>
    isIndustrySector(sector) ? t(`register.industry.${sector}`) : sector;

  const getCompanyTypeLabel = (type: string) =>
    isCompanyType(type) ? t(`register.companyType.${type}`) : type;

  // Client-side filter over the loaded page: matches the company name
  // (case-insensitive) or the CNPJ ignoring punctuation.
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const searchDigits = normalizedSearch.replace(/\D/g, '');
  const visibleCompanies = (verificationQueue?.companies ?? []).filter(company => {
    if (!normalizedSearch) return true;
    const nameMatch = company.companyName.toLowerCase().includes(normalizedSearch);
    const cnpjMatch =
      searchDigits.length > 0 && company.cnpj.replace(/\D/g, '').includes(searchDigits);
    return nameMatch || cnpjMatch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !verificationQueue) {
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
            onClick={() => loadVerificationQueue()}
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

      {/* Statistics Chart area replaced with simple cards for now due to library limits */}
      {verificationQueue && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Pending sx={{ fontSize: 40, color: 'warning.main' }} />
                <Typography variant='h6' sx={{ mt: 1 }}>
                  {t('companyVerification.stats.queueTotal')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('companyVerification.stats.queueTotalCaption')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Verified sx={{ fontSize: 40, color: 'success.main' }} />
                <Typography variant='h6' sx={{ mt: 1 }}>
                  {t('companyVerification.stats.verified')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('companyVerification.stats.verifiedCaption')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Warning sx={{ fontSize: 40, color: 'error.main' }} />
                <Typography variant='h6' sx={{ mt: 1 }}>
                  {t('companyVerification.stats.issues')}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t('companyVerification.stats.issuesCaption')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Queue Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant='h6'
            sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {t('companyVerification.queueTitle')}
            <Chip
              label={`${verificationQueue?.totalCount || 0} empresa(s)`}
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

        {/* Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => {
              setCurrentTab(newValue);
              const filters: Array<'all' | 'pending' | 'unvalidated_cnpj'> = [
                'pending',
                'all',
                'unvalidated_cnpj',
              ];
              setFilter(filters[newValue]);
              setPage(1);
            }}
          >
            <Tab label={t('companyVerification.tabs.pending')} />
            <Tab label={t('companyVerification.tabs.all')} />
            <Tab label={t('companyVerification.tabs.invalidCnpj')} />
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

        {/* Queue Items */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading && !verificationQueue?.companies.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : visibleCompanies.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              {t('companyVerification.emptyQueue')}
            </Typography>
          ) : (
            visibleCompanies.map((company, _idx) => (
              <Box
                key={company.id}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  p: 2,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  border: 1,
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: company.status !== 'pending' ? 0.75 : 1,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    bgcolor:
                      company.status === 'pending'
                        ? 'warning.main'
                        : company.status === 'approved'
                          ? 'success.main'
                          : 'error.main',
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                    pl: 1,
                  }}
                >
                  <Box>
                    <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
                      {company.companyName}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      CNPJ: {company.cnpj}
                      {company.cnpjValidated ? (
                        <CheckCircle sx={{ fontSize: 12, color: 'success.main' }} />
                      ) : (
                        <Warning sx={{ fontSize: 12, color: 'warning.main' }} />
                      )}
                    </Typography>
                  </Box>
                  <Chip
                    label={formatDate(company.createdAt).split(',')[0]}
                    size='small'
                    sx={{
                      bgcolor: 'action.hover',
                      color: 'text.secondary',
                      height: 20,
                      fontSize: '0.65rem',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 1.5,
                    pl: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant='caption'
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.6rem',
                        color: 'text.secondary',
                      }}
                    >
                      {t('companyVerification.location')}
                    </Typography>
                    <Typography variant='caption' sx={{ fontWeight: 'medium' }}>
                      {company.city || 'N/A'}, {company.state || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {company.status === 'pending' ? (
                      <>
                        <IconButton
                          size='small'
                          aria-label={`${t('companyVerification.reject')} ${company.companyName}`}
                          sx={{
                            bgcolor: 'error.light',
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.main', color: 'white' },
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                          }}
                          onClick={() => {
                            setSelectedCompany(company);
                            handleVerifyCompany(company.id, 'rejected');
                          }}
                        >
                          <Close fontSize='small' />
                        </IconButton>
                        <IconButton
                          size='small'
                          aria-label={`${t('companyVerification.approve')} ${company.companyName}`}
                          sx={{
                            bgcolor: 'success.light',
                            color: 'success.main',
                            '&:hover': { bgcolor: 'success.main', color: 'white' },
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                          }}
                          onClick={() => {
                            setSelectedCompany(company);
                            handleVerifyCompany(company.id, 'approved');
                          }}
                        >
                          <Check fontSize='small' />
                        </IconButton>
                      </>
                    ) : (
                      <Typography
                        variant='caption'
                        sx={{
                          fontWeight: 'bold',
                          color: 'text.secondary',
                          fontStyle: 'italic',
                          mr: 1,
                        }}
                      >
                        {company.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                      </Typography>
                    )}
                    <IconButton
                      size='small'
                      aria-label={`Ver detalhes de ${company.companyName}`}
                      sx={{
                        bgcolor: 'action.hover',
                        color: 'text.secondary',
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                      }}
                      onClick={() => {
                        setSelectedCompany(company);
                        setDetailsDialog(true);
                      }}
                    >
                      <Visibility fontSize='small' />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Pagination placeholder if needed */}
      {verificationQueue && verificationQueue.totalPages > 1 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            {t('companyVerification.pagination', {
              current: verificationQueue.currentPage,
              total: verificationQueue.totalPages,
            })}
          </Typography>
        </Box>
      )}

      {/* Company Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business />
          {t('companyVerification.detailsTitle')}
        </DialogTitle>
        <DialogContent>
          {selectedCompany && (
            <Box sx={{ mt: 1 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant='h6'>
                    {t('companyVerification.sections.basicInfo')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Business color='primary' />
                        <Box>
                          <Typography variant='subtitle2'>
                            {t('companyVerification.fields.tradeName')}
                          </Typography>
                          <Typography variant='body2'>{selectedCompany.companyName}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Business color='primary' />
                        <Box>
                          <Typography variant='subtitle2'>
                            {t('companyVerification.fields.corporateName')}
                          </Typography>
                          <Typography variant='body2'>{selectedCompany.corporateName}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Email color='primary' />
                        <Box>
                          <Typography variant='subtitle2'>Email</Typography>
                          <Typography variant='body2'>{selectedCompany.email}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Phone color='primary' />
                        <Box>
                          <Typography variant='subtitle2'>
                            {t('companyVerification.fields.phone')}
                          </Typography>
                          <Typography variant='body2'>
                            {selectedCompany.phone || t('companyVerification.notInformed')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant='h6'>
                    {t('companyVerification.sections.documentation')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.responsibleCpf')}
                      </Typography>
                      <Typography variant='body2' sx={{ mb: 2 }}>
                        {selectedCompany.cpf}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='subtitle2'>CNPJ</Typography>
                        {selectedCompany.cnpjValidated ? (
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                      </Box>
                      <Typography variant='body2' sx={{ mb: 1 }}>
                        {selectedCompany.cnpj}
                      </Typography>
                      {!selectedCompany.cnpjValidated && (
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => handleValidateCNPJ(selectedCompany.id)}
                          disabled={cnpjValidating}
                          startIcon={
                            cnpjValidating ? <CircularProgress size={16} /> : <CheckCircle />
                          }
                        >
                          {t('companyVerification.validateCnpj')}
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant='h6'>{t('companyVerification.sections.address')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn color='primary' />
                    <Box>
                      <Typography variant='body2'>{selectedCompany.address}</Typography>
                      {selectedCompany.street && (
                        <Typography variant='caption' color='text.secondary'>
                          {selectedCompany.street}, {selectedCompany.number}
                          {selectedCompany.city &&
                            ` - ${selectedCompany.city}/${selectedCompany.state}`}
                          {selectedCompany.zipCode && ` - CEP: ${selectedCompany.zipCode}`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant='h6'>
                    {t('companyVerification.sections.commercialInfo')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Category color='primary' />
                        <Box>
                          <Typography variant='subtitle2'>
                            {t('companyVerification.fields.sector')}
                          </Typography>
                          <Typography variant='body2'>
                            {getSectorLabel(selectedCompany.industrySector)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.companyType')}
                      </Typography>
                      <Typography variant='body2'>
                        {getCompanyTypeLabel(selectedCompany.companyType)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.companySize')}
                      </Typography>
                      <Typography variant='body2'>
                        {selectedCompany.companySize || t('companyVerification.notInformed')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.revenue')}
                      </Typography>
                      <Typography variant='body2'>
                        {selectedCompany.annualRevenue || t('companyVerification.notInformed')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.website')}
                      </Typography>
                      <Typography variant='body2'>
                        {selectedCompany.website || t('companyVerification.notInformed')}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant='h6'>{t('companyVerification.sections.contact')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.contactPerson')}
                      </Typography>
                      <Typography variant='body2'>
                        {selectedCompany.contactPerson || t('companyVerification.notInformed')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2'>
                        {t('companyVerification.fields.contactTitle')}
                      </Typography>
                      <Typography variant='body2'>
                        {selectedCompany.contactTitle || t('companyVerification.notInformed')}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>{t('companyVerification.close')}</Button>
          {selectedCompany?.status === 'pending' && (
            <Button
              variant='contained'
              onClick={() => {
                setDetailsDialog(false);
                setVerificationDialog(true);
              }}
            >
              {t('companyVerification.verifyCompany')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={verificationDialog}
        onClose={() => setVerificationDialog(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {t('companyVerification.verifyCompany')}: {selectedCompany?.companyName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              {t('companyVerification.verifyPrompt')}
            </Typography>

            <TextField
              fullWidth
              label={t('companyVerification.reasonLabel')}
              multiline
              rows={3}
              value={verificationReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setVerificationReason(e.target.value)
              }
              placeholder={t('companyVerification.reasonPlaceholder')}
              sx={{ mb: 2 }}
            />

            {selectedCompany && !selectedCompany.cnpjValidated && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                <Typography variant='body2'>
                  {t('companyVerification.unvalidatedWarning')}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>
            {t('companyVerification.cancel')}
          </Button>
          <Button
            variant='outlined'
            color='error'
            onClick={() => selectedCompany && handleVerifyCompany(selectedCompany.id, 'rejected')}
          >
            {t('companyVerification.reject')}
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={() => selectedCompany && handleVerifyCompany(selectedCompany.id, 'approved')}
          >
            {t('companyVerification.approve')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCompanyVerificationPage;
