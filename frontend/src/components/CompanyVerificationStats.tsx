import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';
import { Pending, Verified, Warning } from '@mui/icons-material';
import { useT } from '../contexts/LanguageContext';
import type { TranslationKey } from '../locales';

interface StatCard {
  titleKey: TranslationKey;
  captionKey: TranslationKey;
  icon: React.ReactNode;
}

const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';

const STAT_CARDS: StatCard[] = [
  {
    titleKey: 'companyVerification.stats.queueTotal',
    captionKey: 'companyVerification.stats.queueTotalCaption',
    icon: <Pending sx={{ fontSize: 40, color: 'warning.main' }} />,
  },
  {
    titleKey: 'companyVerification.stats.verified',
    captionKey: 'companyVerification.stats.verifiedCaption',
    icon: <Verified sx={{ fontSize: 40, color: 'success.main' }} />,
  },
  {
    titleKey: 'companyVerification.stats.issues',
    captionKey: 'companyVerification.stats.issuesCaption',
    icon: <Warning sx={{ fontSize: 40, color: 'error.main' }} />,
  },
];

/**
 * Three summary cards above the verification queue.
 *
 * @example
 * <CompanyVerificationStats />
 */
export const CompanyVerificationStats: React.FC = () => {
  const t = useT();

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {STAT_CARDS.map(card => (
        <Grid size={{ xs: 12, sm: 4 }} key={card.titleKey}>
          <Card sx={{ boxShadow: CARD_SHADOW }}>
            <CardContent sx={{ textAlign: 'center' }}>
              {card.icon}
              <Typography variant='h6' sx={{ mt: 1 }}>
                {t(card.titleKey)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t(card.captionKey)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
