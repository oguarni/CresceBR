import React from 'react';
import { Box, Typography } from '@mui/material';
import { useT } from '../../contexts/LanguageContext';
import { SUPPLIER_NAV_ITEMS } from './supplierNavItems';

interface SupplierBottomNavProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

/**
 * Fixed bottom bar mirroring the drawer's destinations, with the current page
 * highlighted and inert.
 *
 * @example
 * <SupplierBottomNav activePath='/supplier/dashboard' onNavigate={navigate} />
 */
export const SupplierBottomNav: React.FC<SupplierBottomNavProps> = ({ activePath, onNavigate }) => {
  const t = useT();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        width: '100%',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 40,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 1.5, px: 1 }}>
        {SUPPLIER_NAV_ITEMS.map(({ path, labelKey, Icon }) => {
          const isActive = path === activePath;

          return (
            <Box
              key={path}
              onClick={isActive ? undefined : () => onNavigate(path)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                cursor: 'pointer',
                color: isActive ? 'primary.main' : 'text.secondary',
                ...(isActive ? {} : { '&:hover': { color: 'primary.main' } }),
              }}
            >
              <Icon sx={{ fontSize: 24, mb: 0.5 }} />
              <Typography variant='caption' sx={{ fontSize: '0.625rem', fontWeight: 500 }}>
                {t(labelKey)}
              </Typography>
            </Box>
          );
        })}
      </Box>
      {/* Spacer keeping the bar clear of the home indicator on gesture-nav devices. */}
      <Box sx={{ height: 24, width: '100%', bgcolor: 'background.paper' }} />
    </Box>
  );
};
