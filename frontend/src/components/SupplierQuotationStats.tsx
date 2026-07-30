import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { Assignment, CheckCircle, Schedule, TrendingUp } from '@mui/icons-material';
import { useT } from '../contexts/LanguageContext';
import type { TranslationKey } from '../locales';

interface SupplierQuotationStatsProps {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
}

interface StatTile {
  labelKey: TranslationKey;
  value: string;
  icon: React.ReactNode;
}

/**
 * Win rate as a whole percentage, guarding the zero-quotation case so a new
 * supplier sees 0% rather than NaN%.
 */
const winRatePercent = (completedCount: number, totalCount: number): number =>
  totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

/**
 * Four summary tiles above the supplier quotation queue.
 *
 * The `quotation-stats` test id scopes queries to this block: the tile labels
 * collide with the translated status chips on the cards below, so tests that
 * assert on a label must narrow to this subtree first.
 *
 * @example
 * <SupplierQuotationStats totalCount={12} pendingCount={3} completedCount={7} />
 */
export const SupplierQuotationStats: React.FC<SupplierQuotationStatsProps> = ({
  totalCount,
  pendingCount,
  completedCount,
}) => {
  const t = useT();

  const tiles: StatTile[] = [
    {
      labelKey: 'supplierQuotations.stats.totalRequests',
      value: String(totalCount),
      icon: <Assignment color='primary' sx={{ mr: 1 }} />,
    },
    {
      labelKey: 'supplierQuotations.stats.pendingResponse',
      value: String(pendingCount),
      icon: <Schedule color='warning' sx={{ mr: 1 }} />,
    },
    {
      labelKey: 'supplierQuotations.stats.completed',
      value: String(completedCount),
      icon: <CheckCircle color='success' sx={{ mr: 1 }} />,
    },
    {
      labelKey: 'supplierQuotations.stats.winRate',
      value: `${winRatePercent(completedCount, totalCount)}%`,
      icon: <TrendingUp color='info' sx={{ mr: 1 }} />,
    },
  ];

  return (
    <Grid container spacing={3} mb={4} data-testid='quotation-stats'>
      {tiles.map(tile => (
        <Grid size={{ xs: 12, sm: 3 }} key={tile.labelKey}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                {tile.icon}
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t(tile.labelKey)}
                  </Typography>
                  <Typography variant='h6'>{tile.value}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
