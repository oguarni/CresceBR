import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupplierDashboard } from '../hooks/useSupplierDashboard';
import { SupplierDashboardHeader } from '../components/supplier/SupplierDashboardHeader';
import { SupplierNavDrawer } from '../components/supplier/SupplierNavDrawer';
import { SupplierBottomNav } from '../components/supplier/SupplierBottomNav';
import { SupplierMetricCards } from '../components/supplier/SupplierMetricCards';
import { SupplierQuoteQueue } from '../components/supplier/SupplierQuoteQueue';
import { SupplierRecentOrders } from '../components/supplier/SupplierRecentOrders';
import { dateLocaleFor } from '../utils/supplierDashboard';

const DASHBOARD_PATH = '/supplier/dashboard';

/**
 * The supplier's landing screen: headline metrics, the quotations waiting on
 * them, and recent orders, wrapped in the supplier area's own navigation.
 *
 * Data loading lives in `useSupplierDashboard` and the derivations in
 * `utils/supplierDashboard`; this file only wires the blocks together.
 */
const SupplierDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { metrics, pendingQuotes, recentOrders } = useSupplierDashboard();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const dateLocale = dateLocaleFor(language);

  const navigateFromDrawer = (path: string) => {
    setDrawerOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <SupplierDashboardHeader
        companyName={user?.companyName}
        pendingQuotations={metrics.pendingQuotations}
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenNotifications={() => navigate('/supplier/quotations')}
      />

      <SupplierNavDrawer
        open={drawerOpen}
        companyName={user?.companyName}
        email={user?.email}
        onClose={() => setDrawerOpen(false)}
        onNavigate={navigateFromDrawer}
        onLogout={handleLogout}
      />

      <Box
        component='main'
        sx={{ p: 2, maxWidth: 'md', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <SupplierMetricCards metrics={metrics} />

        <SupplierQuoteQueue
          quotes={pendingQuotes}
          dateLocale={dateLocale}
          onViewAll={() => navigate('/supplier/quotations')}
          onOpenQuote={id => navigate(`/supplier/quotations/${id}`)}
        />

        <SupplierRecentOrders
          orders={recentOrders}
          dateLocale={dateLocale}
          onOpenOrders={() => navigate('/supplier/orders')}
        />
      </Box>

      <SupplierBottomNav activePath={DASHBOARD_PATH} onNavigate={navigate} />
    </Box>
  );
};

export default SupplierDashboardPage;
