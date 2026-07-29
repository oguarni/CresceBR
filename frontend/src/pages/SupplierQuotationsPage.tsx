import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Search,
  Assignment,
  Schedule,
  Info,
  Business,
  Email,
  Phone,
  Send,
  TrendingUp,
  PlayArrow,
} from '@mui/icons-material';
import { Quotation } from '@shared/types';
import { quotationsService } from '../services/quotationsService';
import { formatBRL } from '../utils/currency';
import { useT } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { browserLogger } from '../utils/browserLogger';

type Translate = ReturnType<typeof useT>;

interface QuotationResponse {
  quotationId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    leadTime: number;
    availability: string;
    notes?: string;
  }>;
  totalAmount: number;
  validUntil: string;
  deliveryTerms: string;
  paymentTerms: string;
  notes: string;
}

interface ResponseDialog {
  open: boolean;
  quotation: Quotation | null;
  response: QuotationResponse;
}

const initialResponse: QuotationResponse = {
  quotationId: 0,
  items: [],
  totalAmount: 0,
  validUntil: '',
  deliveryTerms: '',
  paymentTerms: '',
  notes: '',
};

const getStatusColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Schedule />;
    case 'processed':
      return <PlayArrow />;
    case 'completed':
      return <CheckCircle />;
    case 'rejected':
      return <Cancel />;
    default:
      return <Info />;
  }
};

const getPriorityColor = (
  requestedDeliveryDate?: Date
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  if (!requestedDeliveryDate) return 'default';

  const now = new Date();
  const delivery = new Date(requestedDeliveryDate);
  const daysDiff = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) return 'error'; // Urgent
  if (daysDiff < 14) return 'warning'; // High
  if (daysDiff < 30) return 'info'; // Medium
  return 'success'; // Low
};

// Tab order in the UI. Indexes into quotationsByStatus and the
// supplierQuotations.empty.* / .tabs.* dictionary sections, so the array order
// and the Tabs render order must stay in sync.
const TAB_KEYS = ['all', 'pending', 'processed', 'completed', 'rejected'] as const;

const QUOTATION_STATUSES = ['pending', 'processed', 'completed', 'rejected'] as const;

type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

const isQuotationStatus = (status: string): status is QuotationStatus =>
  (QUOTATION_STATUSES as readonly string[]).includes(status);

/**
 * Renders a quotation status in the active language, falling back to the raw
 * value so an unrecognised status from the API still shows something useful.
 *
 * @example
 * translateStatus(t, 'pending'); // 'Pendente' under pt
 */
const translateStatus = (t: Translate, status: string): string =>
  isQuotationStatus(status) ? t(`supplierQuotations.status.${status}`) : status;

type PriorityKey = 'none' | 'urgent' | 'high' | 'medium' | 'low';

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
const getPriorityKey = (requestedDeliveryDate?: Date): PriorityKey => {
  if (!requestedDeliveryDate) return 'none';

  const now = new Date();
  const delivery = new Date(requestedDeliveryDate);
  const daysDiff = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 7) return 'urgent';
  if (daysDiff < 14) return 'high';
  if (daysDiff < 30) return 'medium';
  return 'low';
};

interface QuotationCardProps {
  quotation: Quotation;
  onViewDetails: (quotation: Quotation) => void;
  onRespond: (quotation: Quotation) => void;
  onAccept: (quotationId: number) => void;
  onReject: (quotationId: number, reason: string) => void;
}

/**
 * Summary card for a single quotation request in the supplier queue.
 *
 * Declared at module scope on purpose: defining it inside SupplierQuotationsPage
 * gave React a new component type on every render, remounting each card and
 * discarding its DOM state (and focus) on any parent state change.
 *
 * @example
 * <QuotationCard
 *   quotation={quotation}
 *   onViewDetails={handleViewDetails}
 *   onRespond={handleRespond}
 *   onAccept={handleAcceptQuotation}
 *   onReject={handleRejectQuotation}
 * />
 */
const QuotationCard: React.FC<QuotationCardProps> = ({
  quotation,
  onViewDetails,
  onRespond,
  onAccept,
  onReject,
}) => {
  const t = useT();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display='flex' justifyContent='space-between' alignItems='start' mb={2}>
          <Box>
            <Typography variant='h6'>
              {t('supplierQuotations.card.quoteRequest', { id: quotation.id })}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {quotation.company?.companyName}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {new Date(quotation.createdAt!).toLocaleDateString()}
            </Typography>
          </Box>
          <Box display='flex' gap={1} flexDirection='column' alignItems='flex-end'>
            <Chip
              label={translateStatus(t, quotation.status)}
              color={getStatusColor(quotation.status)}
              icon={getStatusIcon(quotation.status)}
            />
            {quotation.requestedDeliveryDate && (
              <Chip
                label={t(
                  `supplierQuotations.priority.${getPriorityKey(quotation.requestedDeliveryDate)}`
                )}
                color={getPriorityColor(quotation.requestedDeliveryDate)}
                size='small'
              />
            )}
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant='body2' color='text.secondary'>
            {t('supplierQuotations.card.items', { count: quotation.items?.length || 0 })}
          </Typography>
          {quotation.totalAmount && (
            <Typography variant='body2' color='text.secondary'>
              {t('supplierQuotations.card.estimatedValue', {
                value: formatBRL(quotation.totalAmount),
              })}
            </Typography>
          )}
          {quotation.requestedDeliveryDate && (
            <Typography variant='body2' color='text.secondary'>
              {t('supplierQuotations.requestedDelivery', {
                date: new Date(quotation.requestedDeliveryDate).toLocaleDateString(),
              })}
            </Typography>
          )}
        </Box>

        <Box display='flex' alignItems='center' gap={1}>
          {quotation.items?.slice(0, 3).map((item, index) => (
            <Chip
              key={index}
              label={`${item.quantity}x ${item.product?.name || t('supplierQuotations.productFallback')}`}
              size='small'
              variant='outlined'
            />
          ))}
          {(quotation.items?.length || 0) > 3 && (
            <Chip
              label={t('supplierQuotations.card.moreItems', {
                count: (quotation.items?.length || 0) - 3,
              })}
              size='small'
              variant='outlined'
            />
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size='small' startIcon={<Visibility />} onClick={() => onViewDetails(quotation)}>
          {t('supplierQuotations.card.details')}
        </Button>
        {quotation.status === 'pending' && (
          <>
            <Button
              size='small'
              variant='contained'
              startIcon={<Send />}
              onClick={() => onRespond(quotation)}
            >
              {t('supplierQuotations.card.respond')}
            </Button>
            <Button
              size='small'
              variant='outlined'
              color='success'
              startIcon={<CheckCircle />}
              onClick={() => onAccept(quotation.id)}
            >
              {t('supplierQuotations.card.accept')}
            </Button>
            <Button
              size='small'
              variant='outlined'
              color='error'
              startIcon={<Cancel />}
              onClick={() => onReject(quotation.id, t('supplierQuotations.declineReason'))}
            >
              {t('supplierQuotations.card.decline')}
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

const SupplierQuotationsPage: React.FC = () => {
  const t = useT();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [responseDialog, setResponseDialog] = useState<ResponseDialog>({
    open: false,
    quotation: null,
    response: initialResponse,
  });
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      // Supplier-scoped endpoint: the backend already restricts results to
      // quotations that include this supplier's products.
      const data = await quotationsService.getSupplierQuotations();
      setQuotations(data);
    } catch (_error) {
      browserLogger.error('Failed to load quotations', { error: _error });
      toast.error(t('supplierQuotations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const handleViewDetails = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setDetailsDialogOpen(true);
  };

  const handleRespond = (quotation: Quotation) => {
    const response: QuotationResponse = {
      quotationId: quotation.id,
      items:
        quotation.items?.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product?.unitPrice || 0,
          totalPrice: (item.product?.unitPrice || 0) * item.quantity,
          leadTime: item.product?.leadTime || 7,
          availability: item.product?.availability || 'in_stock',
          notes: '',
        })) || [],
      totalAmount: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      deliveryTerms: 'FOB Origin',
      paymentTerms: 'Net 30',
      notes: '',
    };

    // Calculate total
    response.totalAmount = response.items.reduce((sum, item) => sum + item.totalPrice, 0);

    setResponseDialog({
      open: true,
      quotation,
      response,
    });
  };

  const handleAcceptQuotation = async (quotationId: number) => {
    try {
      await quotationsService.updateSupplierQuotation(quotationId, { status: 'completed' });
      toast.success(t('supplierQuotations.acceptSuccess'));
      loadQuotations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('supplierQuotations.acceptError'));
    }
  };

  const handleRejectQuotation = async (quotationId: number, reason: string) => {
    try {
      await quotationsService.updateSupplierQuotation(quotationId, {
        status: 'rejected',
        adminNotes: reason,
      });
      toast.success(t('supplierQuotations.rejectSuccess'));
      loadQuotations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('supplierQuotations.rejectError'));
    }
  };

  const handleSubmitResponse = async () => {
    try {
      await quotationsService.updateSupplierQuotation(responseDialog.response.quotationId, {
        status: 'processed',
        adminNotes: responseDialog.response.notes || undefined,
      });
      toast.success(t('supplierQuotations.submitSuccess'));
      setResponseDialog({
        open: false,
        quotation: null,
        response: initialResponse,
      });
      loadQuotations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('supplierQuotations.submitError'));
    }
  };

  const updateItemPrice = (index: number, unitPrice: number) => {
    const updatedItems = [...responseDialog.response.items];
    updatedItems[index].unitPrice = unitPrice;
    updatedItems[index].totalPrice = unitPrice * updatedItems[index].quantity;

    const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    setResponseDialog({
      ...responseDialog,
      response: {
        ...responseDialog.response,
        items: updatedItems,
        totalAmount,
      },
    });
  };

  const updateItemAvailability = (index: number, availability: string) => {
    const updatedItems = [...responseDialog.response.items];
    updatedItems[index].availability = availability;

    setResponseDialog({
      ...responseDialog,
      response: {
        ...responseDialog.response,
        items: updatedItems,
      },
    });
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch =
      quotation.id.toString().includes(searchTerm) ||
      quotation.company?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || quotation.status === statusFilter;

    let matchesDate = true;
    if (dateFilter) {
      const quotationDate = new Date(quotation.createdAt!);
      const today = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - quotationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    let matchesPriority = true;
    if (priorityFilter) {
      matchesPriority = getPriorityKey(quotation.requestedDeliveryDate) === priorityFilter;
    }

    return matchesSearch && matchesStatus && matchesDate && matchesPriority;
  });

  const quotationsByStatus = {
    pending: filteredQuotations.filter(q => q.status === 'pending'),
    processed: filteredQuotations.filter(q => q.status === 'processed'),
    completed: filteredQuotations.filter(q => q.status === 'completed'),
    rejected: filteredQuotations.filter(q => q.status === 'rejected'),
    all: filteredQuotations,
  };

  if (loading) {
    return (
      <Container>
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant='h4' component='h1' gutterBottom>
          {t('supplierQuotations.title')}
        </Typography>
        <Typography variant='subtitle1' color='text.secondary'>
          {t('supplierQuotations.subtitle')}
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} mb={4} data-testid='quotation-stats'>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                <Assignment color='primary' sx={{ mr: 1 }} />
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t('supplierQuotations.stats.totalRequests')}
                  </Typography>
                  <Typography variant='h6'>{quotations.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                <Schedule color='warning' sx={{ mr: 1 }} />
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t('supplierQuotations.stats.pendingResponse')}
                  </Typography>
                  <Typography variant='h6'>{quotationsByStatus.pending.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                <CheckCircle color='success' sx={{ mr: 1 }} />
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t('supplierQuotations.stats.completed')}
                  </Typography>
                  <Typography variant='h6'>{quotationsByStatus.completed.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                <TrendingUp color='info' sx={{ mr: 1 }} />
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t('supplierQuotations.stats.winRate')}
                  </Typography>
                  <Typography variant='h6'>
                    {quotations.length > 0
                      ? Math.round((quotationsByStatus.completed.length / quotations.length) * 100)
                      : 0}
                    %
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                placeholder={t('supplierQuotations.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>{t('supplierQuotations.filters.status')}</InputLabel>
                <Select
                  value={statusFilter}
                  label={t('supplierQuotations.filters.status')}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <MenuItem value=''>{t('supplierQuotations.filters.allStatus')}</MenuItem>
                  <MenuItem value='pending'>{t('supplierQuotations.status.pending')}</MenuItem>
                  <MenuItem value='processed'>{t('supplierQuotations.status.processed')}</MenuItem>
                  <MenuItem value='completed'>{t('supplierQuotations.status.completed')}</MenuItem>
                  <MenuItem value='rejected'>{t('supplierQuotations.status.rejected')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>{t('supplierQuotations.filters.priority')}</InputLabel>
                <Select
                  value={priorityFilter}
                  label={t('supplierQuotations.filters.priority')}
                  onChange={e => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value=''>{t('supplierQuotations.filters.allPriority')}</MenuItem>
                  <MenuItem value='urgent'>{t('supplierQuotations.priority.urgent')}</MenuItem>
                  <MenuItem value='high'>{t('supplierQuotations.priority.high')}</MenuItem>
                  <MenuItem value='medium'>{t('supplierQuotations.priority.medium')}</MenuItem>
                  <MenuItem value='low'>{t('supplierQuotations.priority.low')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>{t('supplierQuotations.filters.dateRange')}</InputLabel>
                <Select
                  value={dateFilter}
                  label={t('supplierQuotations.filters.dateRange')}
                  onChange={e => setDateFilter(e.target.value)}
                >
                  <MenuItem value=''>{t('supplierQuotations.filters.allTime')}</MenuItem>
                  <MenuItem value='today'>{t('supplierQuotations.filters.today')}</MenuItem>
                  <MenuItem value='week'>{t('supplierQuotations.filters.thisWeek')}</MenuItem>
                  <MenuItem value='month'>{t('supplierQuotations.filters.thisMonth')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
        <Tab label={`${t('supplierQuotations.tabs.all')} (${quotationsByStatus.all.length})`} />
        <Tab
          label={`${t('supplierQuotations.tabs.pending')} (${quotationsByStatus.pending.length})`}
        />
        <Tab
          label={`${t('supplierQuotations.tabs.processed')} (${quotationsByStatus.processed.length})`}
        />
        <Tab
          label={`${t('supplierQuotations.tabs.completed')} (${quotationsByStatus.completed.length})`}
        />
        <Tab
          label={`${t('supplierQuotations.tabs.rejected')} (${quotationsByStatus.rejected.length})`}
        />
      </Tabs>

      {/* Quotations List */}
      {(() => {
        const activeTab = TAB_KEYS[selectedTab] ?? 'all';
        const displayQuotations = quotationsByStatus[activeTab];

        if (displayQuotations.length === 0) {
          return (
            <Alert severity='info' sx={{ mt: 2 }}>
              {t(`supplierQuotations.empty.${activeTab}`)}
            </Alert>
          );
        }

        return displayQuotations.map(quotation => (
          <QuotationCard
            key={quotation.id}
            quotation={quotation}
            onViewDetails={handleViewDetails}
            onRespond={handleRespond}
            onAccept={handleAcceptQuotation}
            onReject={handleRejectQuotation}
          />
        ));
      })()}

      {/* Response Dialog */}
      <Dialog
        open={responseDialog.open}
        onClose={() =>
          setResponseDialog({ open: false, quotation: null, response: initialResponse })
        }
        maxWidth='lg'
        fullWidth
      >
        <DialogTitle>
          {t('supplierQuotations.response.title', { id: responseDialog.quotation?.id ?? '' })}
        </DialogTitle>
        <DialogContent>
          {responseDialog.quotation && (
            <Box>
              {/* Customer Info */}
              <Box mb={3}>
                <Typography variant='h6' gutterBottom>
                  {t('supplierQuotations.customerInfo')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      {t('supplierQuotations.response.company', {
                        name: responseDialog.quotation.company?.companyName ?? '',
                      })}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {t('supplierQuotations.response.email', {
                        email: responseDialog.quotation.company?.email ?? '',
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      {t('supplierQuotations.requestedDelivery', {
                        date: responseDialog.quotation.requestedDeliveryDate
                          ? new Date(
                              responseDialog.quotation.requestedDeliveryDate
                            ).toLocaleDateString()
                          : t('supplierQuotations.response.notSpecified'),
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Quote Items */}
              <Typography variant='h6' gutterBottom>
                {t('supplierQuotations.response.quoteItems')}
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('supplierQuotations.response.colProduct')}</TableCell>
                      <TableCell>{t('supplierQuotations.response.colQty')}</TableCell>
                      <TableCell>{t('supplierQuotations.response.colUnitPrice')}</TableCell>
                      <TableCell>{t('supplierQuotations.response.colTotal')}</TableCell>
                      <TableCell>{t('supplierQuotations.response.colAvailability')}</TableCell>
                      <TableCell>{t('supplierQuotations.response.colLeadTime')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responseDialog.response.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {responseDialog.quotation?.items?.[index]?.product?.name ||
                            t('supplierQuotations.productFallback')}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <TextField
                            type='number'
                            size='small'
                            value={item.unitPrice}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateItemPrice(index, Number(e.target.value))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>{formatBRL(item.totalPrice)}</TableCell>
                        <TableCell>
                          <Select
                            size='small'
                            value={item.availability}
                            onChange={e => updateItemAvailability(index, e.target.value)}
                          >
                            <MenuItem value='in_stock'>
                              {t('supplierQuotations.availability.in_stock')}
                            </MenuItem>
                            <MenuItem value='limited'>
                              {t('supplierQuotations.availability.limited')}
                            </MenuItem>
                            <MenuItem value='out_of_stock'>
                              {t('supplierQuotations.availability.out_of_stock')}
                            </MenuItem>
                            <MenuItem value='custom_order'>
                              {t('supplierQuotations.availability.custom_order')}
                            </MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {t('supplierQuotations.response.days', { count: item.leadTime })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Quote Terms */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('supplierQuotations.response.totalAmount')}
                    value={formatBRL(responseDialog.response.totalAmount)}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type='date'
                    label={t('supplierQuotations.response.validUntil')}
                    value={responseDialog.response.validUntil}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setResponseDialog({
                        ...responseDialog,
                        response: { ...responseDialog.response, validUntil: e.target.value },
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t('supplierQuotations.response.paymentTerms')}
                    value={responseDialog.response.paymentTerms}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setResponseDialog({
                        ...responseDialog,
                        response: { ...responseDialog.response, paymentTerms: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('supplierQuotations.response.deliveryTerms')}
                    value={responseDialog.response.deliveryTerms}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setResponseDialog({
                        ...responseDialog,
                        response: { ...responseDialog.response, deliveryTerms: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label={t('supplierQuotations.response.additionalNotes')}
                    value={responseDialog.response.notes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setResponseDialog({
                        ...responseDialog,
                        response: { ...responseDialog.response, notes: e.target.value },
                      })
                    }
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setResponseDialog({ open: false, quotation: null, response: initialResponse })
            }
          >
            {t('supplierQuotations.response.cancel')}
          </Button>
          <Button onClick={handleSubmitResponse} variant='contained'>
            {t('supplierQuotations.response.submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {t('supplierQuotations.detailsDialog.title', { id: selectedQuotation?.id ?? '' })}
        </DialogTitle>
        <DialogContent>
          {selectedQuotation && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant='h6' gutterBottom>
                    {t('supplierQuotations.customerInfo')}
                  </Typography>
                  <Box display='flex' alignItems='center' mb={1}>
                    <Business sx={{ mr: 1 }} />
                    <Typography>{selectedQuotation.company?.companyName}</Typography>
                  </Box>
                  <Box display='flex' alignItems='center' mb={1}>
                    <Email sx={{ mr: 1 }} />
                    <Typography>{selectedQuotation.company?.email}</Typography>
                  </Box>
                  {selectedQuotation.company?.phone && (
                    <Box display='flex' alignItems='center' mb={1}>
                      <Phone sx={{ mr: 1 }} />
                      <Typography>{selectedQuotation.company.phone}</Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant='h6' gutterBottom>
                    {t('supplierQuotations.detailsDialog.requestInfo')}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {t('supplierQuotations.detailsDialog.created', {
                      date: new Date(selectedQuotation.createdAt!).toLocaleString(),
                    })}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {t('supplierQuotations.detailsDialog.statusLabel')}
                    <Chip
                      label={translateStatus(t, selectedQuotation.status)}
                      color={getStatusColor(selectedQuotation.status)}
                      size='small'
                    />
                  </Typography>
                  {selectedQuotation.requestedDeliveryDate && (
                    <Typography variant='body2' color='text.secondary'>
                      {t('supplierQuotations.requestedDelivery', {
                        date: new Date(
                          selectedQuotation.requestedDeliveryDate
                        ).toLocaleDateString(),
                      })}
                    </Typography>
                  )}
                  {selectedQuotation.adminNotes && (
                    <Typography variant='body2' color='text.secondary'>
                      {t('supplierQuotations.detailsDialog.notes', {
                        notes: selectedQuotation.adminNotes,
                      })}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Typography variant='h6' gutterBottom>
                {t('supplierQuotations.detailsDialog.requestedItems')}
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('supplierQuotations.response.colProduct')}</TableCell>
                      <TableCell>{t('supplierQuotations.detailsDialog.colQuantity')}</TableCell>
                      <TableCell>{t('supplierQuotations.detailsDialog.colSpecs')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuotation.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant='body2'>
                              {item.product?.name || t('supplierQuotations.productFallback')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {item.product?.category}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.product?.specifications &&
                          Object.keys(item.product.specifications).length > 0 ? (
                            <Box>
                              {Object.entries(item.product.specifications).map(([key, value]) => (
                                <Typography key={key} variant='caption' display='block'>
                                  {key}: {value}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant='caption' color='text.secondary'>
                              {t('supplierQuotations.detailsDialog.noSpecs')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            {t('supplierQuotations.detailsDialog.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SupplierQuotationsPage;
