import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { Cancel, CheckCircle, Inventory, Warning } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { Product } from '@shared/types';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../locales';

interface ProductStatsCardsProps {
  products: Product[];
}

interface StatCard {
  labelKey: TranslationKey;
  Icon: SvgIconComponent;
  iconColor: 'primary' | 'success' | 'warning' | 'error';
  /** Undefined counts the whole catalogue rather than one availability. */
  availability?: string;
}

const STAT_CARDS: readonly StatCard[] = [
  { labelKey: 'supplierProducts.stats.total', Icon: Inventory, iconColor: 'primary' },
  {
    labelKey: 'supplierProducts.stats.inStock',
    Icon: CheckCircle,
    iconColor: 'success',
    availability: 'in_stock',
  },
  {
    labelKey: 'supplierProducts.stats.limited',
    Icon: Warning,
    iconColor: 'warning',
    availability: 'limited',
  },
  {
    labelKey: 'supplierProducts.stats.outOfStock',
    Icon: Cancel,
    iconColor: 'error',
    availability: 'out_of_stock',
  },
];

/**
 * Catalogue totals by stock status.
 *
 * Counts come from the whole catalogue, not the filtered view, so the headline
 * numbers do not move while the user narrows a search.
 *
 * The `product-stats` test id scopes queries here: these labels are the same
 * text as the availability options below, so tests must narrow first.
 *
 * @example
 * <ProductStatsCards products={products} />
 */
export const ProductStatsCards: React.FC<ProductStatsCardsProps> = ({ products }) => {
  const t = useT();

  const countFor = (availability?: string) =>
    availability
      ? products.filter(product => product.availability === availability).length
      : products.length;

  return (
    <Grid container spacing={3} mb={4} data-testid='product-stats'>
      {STAT_CARDS.map(card => (
        <Grid size={{ xs: 12, sm: 3 }} key={card.labelKey}>
          <Card>
            <CardContent>
              <Box display='flex' alignItems='center'>
                <card.Icon color={card.iconColor} sx={{ mr: 1 }} />
                <Box>
                  <Typography color='text.secondary' variant='body2'>
                    {t(card.labelKey)}
                  </Typography>
                  <Typography variant='h6'>{countFor(card.availability)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
