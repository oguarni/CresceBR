import React from 'react';
import { Box, Button, Card, Chip, IconButton, Typography } from '@mui/material';
import { EditNote, VisibilityOutlined } from '@mui/icons-material';
import type { Quotation } from '@shared/types';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../locales';
import { formatBRL } from '../../utils/currency';
import {
  quoteDisplayStatus,
  quoteTotalValue,
  QUOTE_STATUS_CHIP_STYLES,
} from '../../utils/supplierDashboard';

interface SupplierQuoteQueueProps {
  quotes: Quotation[];
  dateLocale: string;
  onViewAll: () => void;
  onOpenQuote: (quotationId: number) => void;
}

const COLUMNS: ReadonlyArray<{ key: TranslationKey; span: number; align?: 'right' | 'center' }> = [
  { key: 'supplierDashboard.columns.id', span: 2 },
  { key: 'supplierDashboard.columns.buyer', span: 3 },
  { key: 'supplierDashboard.columns.status', span: 3 },
  { key: 'supplierDashboard.columns.value', span: 2, align: 'right' },
  { key: 'supplierDashboard.columns.action', span: 2, align: 'center' },
];

const SECTION_TITLE_SX = {
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'text.secondary',
} as const;

/**
 * Preview of the quotations awaiting this supplier, each row deep-linking to the
 * quotation itself. The column header is hidden on narrow screens, where the
 * rows reflow into a stacked layout.
 *
 * @example
 * <SupplierQuoteQueue
 *   quotes={pendingQuotes}
 *   dateLocale='pt-BR'
 *   onViewAll={() => navigate('/supplier/quotations')}
 *   onOpenQuote={id => navigate(`/supplier/quotations/${id}`)}
 * />
 */
export const SupplierQuoteQueue: React.FC<SupplierQuoteQueueProps> = ({
  quotes,
  dateLocale,
  onViewAll,
  onOpenQuote,
}) => {
  const t = useT();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='subtitle2' sx={SECTION_TITLE_SX}>
          {t('supplierDashboard.quotationQueue')}
        </Typography>
        <Button
          variant='text'
          size='small'
          sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 'auto', p: 0 }}
          onClick={onViewAll}
        >
          {t('supplierDashboard.viewAll')}
        </Button>
      </Box>

      <Card variant='outlined' sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 2,
            p: 1.5,
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          {COLUMNS.map(column => (
            <Box
              key={column.key}
              sx={{ gridColumn: `span ${column.span}`, textAlign: column.align }}
            >
              {t(column.key)}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            '& > *:not(:last-child)': { borderBottom: 1, borderColor: 'divider' },
          }}
        >
          {quotes.map(quote => {
            const status = quoteDisplayStatus(quote.status);
            const chip = QUOTE_STATUS_CHIP_STYLES[status];
            const needsResponse = status === 'Review';

            return (
              <Box
                key={quote.id}
                sx={{
                  p: 1.5,
                  '&:hover': { bgcolor: 'action.hover', transition: 'background-color 0.2s' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant='caption'
                      sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                    >
                      #QT-{quote.id}
                    </Typography>
                    <Chip
                      label={
                        needsResponse
                          ? t('supplierDashboard.statusReview')
                          : t('supplierDashboard.statusNew')
                      }
                      size='small'
                      sx={{
                        height: 18,
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        bgcolor: chip.bgcolor,
                        color: chip.color,
                        border: 1,
                        borderColor: chip.borderColor,
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                  <Typography
                    variant='body2'
                    sx={{ fontFamily: 'monospace', fontWeight: 500, color: 'text.primary' }}
                  >
                    {formatBRL(quoteTotalValue(quote))}
                  </Typography>
                </Box>

                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                >
                  <Box sx={{ minWidth: 0, pr: 2 }}>
                    <Typography
                      variant='body2'
                      noWrap
                      sx={{ fontWeight: 600, color: 'text.primary' }}
                    >
                      {quote.company?.companyName || t('supplierDashboard.fallbackBuyer')}
                    </Typography>
                    <Typography
                      variant='caption'
                      noWrap
                      sx={{ color: 'text.secondary', display: 'block', mt: 0.5, maxWidth: 200 }}
                    >
                      {t('supplierDashboard.itemsCount', { count: quote.items.length })} •{' '}
                      {new Date(quote.createdAt || Date.now()).toLocaleDateString(dateLocale)}
                    </Typography>
                  </Box>
                  <IconButton
                    size='small'
                    aria-label={t('supplierDashboard.quoteActionAria', { id: quote.id })}
                    onClick={() => onOpenQuote(quote.id)}
                    sx={{
                      bgcolor: needsResponse ? 'primary.main' : 'background.paper',
                      color: needsResponse ? 'primary.contrastText' : 'text.primary',
                      border: needsResponse ? 0 : 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                      '&:hover': { bgcolor: needsResponse ? 'primary.dark' : 'action.hover' },
                    }}
                  >
                    {needsResponse ? (
                      <EditNote fontSize='small' />
                    ) : (
                      <VisibilityOutlined fontSize='small' />
                    )}
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Card>
    </Box>
  );
};
