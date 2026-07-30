import React from 'react';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import { SUPPLIER_NAV_ITEMS } from './supplierNavItems';

interface SupplierNavDrawerProps {
  open: boolean;
  companyName?: string;
  email?: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DRAWER_WIDTH = 260;

/**
 * Slide-out navigation with the account header and a sign-out action.
 *
 * @example
 * <SupplierNavDrawer
 *   open={drawerOpen}
 *   companyName={user?.companyName}
 *   email={user?.email}
 *   onClose={closeDrawer}
 *   onNavigate={navigate}
 *   onLogout={handleLogout}
 * />
 */
export const SupplierNavDrawer: React.FC<SupplierNavDrawerProps> = ({
  open,
  companyName,
  email,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const t = useT();

  return (
    <Drawer anchor='left' open={open} onClose={onClose}>
      <Box sx={{ width: DRAWER_WIDTH }} role='presentation'>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            {companyName || t('supplierDashboard.fallbackCompany')}
          </Typography>
          <Typography variant='caption'>{email}</Typography>
        </Box>
        <List>
          {SUPPLIER_NAV_ITEMS.map(({ path, labelKey, Icon }) => (
            <ListItem key={path} disablePadding>
              <ListItemButton onClick={() => onNavigate(path)}>
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={t(labelKey)} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton onClick={onLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary={t('supplierDashboard.nav.logout')} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
