import React from 'react';
import { Box, Card, Grid, Typography } from '@mui/material';
import { LocalShipping, PendingActions, TrendingUp } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../locales';
import { formatBRL } from '../../utils/currency';
import type { DashboardMetrics } from '../../utils/supplierDashboard';

interface SupplierMetricCardsProps {
  metrics: DashboardMetrics;
}

interface MetricTile {
  labelKey: TranslationKey;
  /** Omitted for the revenue tile, whose formatted amount already fills the card. */
  captionKey?: TranslationKey;
  Icon: SvgIconComponent;
  iconColor: string;
  /** The revenue figure needs a smaller variant to fit "R$ 1.234.567,89". */
  compact?: boolean;
}

const METRIC_TILES: readonly MetricTile[] = [
  {
    labelKey: 'supplierDashboard.metrics.pending',
    captionKey: 'supplierDashboard.metrics.pendingSub',
    Icon: PendingActions,
    iconColor: 'warning.main',
  },
  {
    labelKey: 'supplierDashboard.metrics.active',
    captionKey: 'supplierDashboard.metrics.activeSub',
    Icon: LocalShipping,
    iconColor: 'info.main',
  },
  {
    labelKey: 'supplierDashboard.metrics.revenue',
    Icon: TrendingUp,
    iconColor: 'success.main',
    compact: true,
  },
];

const CARD_SX = {
  height: 96,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: 2,
  p: 1.5,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
} as const;

const LABEL_SX = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
} as const;

/**
 * The three headline figures: quotations awaiting a response, orders in flight
 * and revenue to date.
 *
 * @example
 * <SupplierMetricCards metrics={metrics} />
 */
export const SupplierMetricCards: React.FC<SupplierMetricCardsProps> = ({ metrics }) => {
  const t = useT();

  const values: string[] = [
    String(metrics.pendingQuotations),
    String(metrics.activeOrders),
    formatBRL(metrics.monthlyRevenue),
  ];

  return (
    <Grid container spacing={1.5}>
      {METRIC_TILES.map((tile, index) => (
        <Grid size={{ xs: 4 }} key={tile.labelKey}>
          <Card variant='outlined' sx={CARD_SX}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Typography variant='caption' noWrap sx={LABEL_SX}>
                {t(tile.labelKey)}
              </Typography>
              <tile.Icon sx={{ color: tile.iconColor, fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant={tile.compact ? 'h6' : 'h5'}
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2,
                  ...(tile.compact ? { letterSpacing: '-0.05em' } : {}),
                }}
              >
                {values[index]}
              </Typography>
              {tile.captionKey && (
                <Typography
                  variant='caption'
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.625rem',
                    mt: 0.5,
                    display: 'block',
                  }}
                >
                  {t(tile.captionKey)}
                </Typography>
              )}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
