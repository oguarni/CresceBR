import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Quotation } from '@shared/types';
import { useT } from '../contexts/LanguageContext';
import type { TranslationKey } from '../locales';
import { formatBRL } from '../utils/currency';
import type {
  QuotationResponseDraft,
  QuotationResponseTextField,
} from '../utils/quotationResponse';

const AVAILABILITY_OPTIONS = ['in_stock', 'limited', 'out_of_stock', 'custom_order'] as const;

const ITEM_COLUMN_KEYS: TranslationKey[] = [
  'supplierQuotations.response.colProduct',
  'supplierQuotations.response.colQty',
  'supplierQuotations.response.colUnitPrice',
  'supplierQuotations.response.colTotal',
  'supplierQuotations.response.colAvailability',
  'supplierQuotations.response.colLeadTime',
];

interface SupplierQuotationResponseDialogProps {
  open: boolean;
  quotation: Quotation | null;
  draft: QuotationResponseDraft;
  onClose: () => void;
  onSubmit: () => void;
  onItemPriceChange: (index: number, unitPrice: number) => void;
  onItemAvailabilityChange: (index: number, availability: string) => void;
  onTextFieldChange: (field: QuotationResponseTextField, value: string) => void;
}

/**
 * Full-width dialog where a supplier prices each line and sets the quote terms.
 *
 * @example
 * <SupplierQuotationResponseDialog
 *   open={dialog.open}
 *   quotation={dialog.quotation}
 *   draft={dialog.draft}
 *   onClose={closeDialog}
 *   onSubmit={submitResponse}
 *   onItemPriceChange={setItemPrice}
 *   onItemAvailabilityChange={setItemAvailability}
 *   onTextFieldChange={setDraftField}
 * />
 */
export const SupplierQuotationResponseDialog: React.FC<SupplierQuotationResponseDialogProps> = ({
  open,
  quotation,
  draft,
  onClose,
  onSubmit,
  onItemPriceChange,
  onItemAvailabilityChange,
  onTextFieldChange,
}) => {
  const t = useT();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        {t('supplierQuotations.response.title', { id: quotation?.id ?? '' })}
      </DialogTitle>
      <DialogContent>
        {quotation && (
          <Box>
            <Box mb={3}>
              <Typography variant='h6' gutterBottom>
                {t('supplierQuotations.customerInfo')}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('supplierQuotations.response.company', {
                      name: quotation.company?.companyName ?? '',
                    })}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {t('supplierQuotations.response.email', {
                      email: quotation.company?.email ?? '',
                    })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('supplierQuotations.requestedDelivery', {
                      date: quotation.requestedDeliveryDate
                        ? new Date(quotation.requestedDeliveryDate).toLocaleDateString()
                        : t('supplierQuotations.response.notSpecified'),
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Typography variant='h6' gutterBottom>
              {t('supplierQuotations.response.quoteItems')}
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {ITEM_COLUMN_KEYS.map(key => (
                      <TableCell key={key}>{t(key)}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draft.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {quotation.items?.[index]?.product?.name ||
                          t('supplierQuotations.productFallback')}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <TextField
                          type='number'
                          size='small'
                          value={item.unitPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onItemPriceChange(index, Number(e.target.value))
                          }
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>{formatBRL(item.totalPrice)}</TableCell>
                      <TableCell>
                        <Select
                          size='small'
                          value={item.availability}
                          onChange={e => onItemAvailabilityChange(index, e.target.value)}
                        >
                          {AVAILABILITY_OPTIONS.map(option => (
                            <MenuItem value={option} key={option}>
                              {t(`supplierQuotations.availability.${option}`)}
                            </MenuItem>
                          ))}
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

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('supplierQuotations.response.totalAmount')}
                  value={formatBRL(draft.totalAmount)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type='date'
                  label={t('supplierQuotations.response.validUntil')}
                  value={draft.validUntil}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onTextFieldChange('validUntil', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('supplierQuotations.response.paymentTerms')}
                  value={draft.paymentTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onTextFieldChange('paymentTerms', e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('supplierQuotations.response.deliveryTerms')}
                  value={draft.deliveryTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onTextFieldChange('deliveryTerms', e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label={t('supplierQuotations.response.additionalNotes')}
                  value={draft.notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onTextFieldChange('notes', e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('supplierQuotations.response.cancel')}</Button>
        <Button onClick={onSubmit} variant='contained'>
          {t('supplierQuotations.response.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
