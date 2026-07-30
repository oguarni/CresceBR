import React from 'react';
import { Avatar, Badge, Box, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon, NotificationsOutlined } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import BrazilFlag from '../BrazilFlag';

interface SupplierDashboardHeaderProps {
  companyName?: string;
  pendingQuotations: number;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
}

/** Shown when the account has no company name yet, so the avatar is never blank. */
const AVATAR_FALLBACK = 'SG';

/**
 * Sticky app bar: menu button, brand, pending-quotation badge and the company
 * avatar.
 *
 * @example
 * <SupplierDashboardHeader
 *   companyName={user?.companyName}
 *   pendingQuotations={metrics.pendingQuotations}
 *   onOpenMenu={() => setDrawerOpen(true)}
 *   onOpenNotifications={() => navigate('/supplier/quotations')}
 * />
 */
export const SupplierDashboardHeader: React.FC<SupplierDashboardHeaderProps> = ({
  companyName,
  pendingQuotations,
  onOpenMenu,
  onOpenNotifications,
}) => {
  const t = useT();

  return (
    <Box
      component='header'
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color='inherit'
            edge='start'
            sx={{ p: 0.5 }}
            onClick={onOpenMenu}
            aria-label={t('supplierDashboard.menuAria')}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant='h6'
            sx={{ fontWeight: 600, letterSpacing: '-0.025em', fontSize: '1.125rem' }}
          >
            Cresce
            <BrazilFlag size='0.7em' />
            <Box component='span' sx={{ ml: 0.5 }}>
              {t('supplierDashboard.brandSuffix')}
            </Box>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            color='error'
            badgeContent={pendingQuotations}
            sx={{
              '& .MuiBadge-badge': {
                border: '2px solid',
                borderColor: 'primary.main',
                right: 2,
                top: 2,
              },
            }}
          >
            <IconButton
              color='inherit'
              sx={{ p: 0.5 }}
              onClick={onOpenNotifications}
              aria-label={t('supplierDashboard.notificationsAria')}
            >
              <NotificationsOutlined />
            </IconButton>
          </Badge>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            {companyName?.substring(0, 2).toUpperCase() || AVATAR_FALLBACK}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
};
