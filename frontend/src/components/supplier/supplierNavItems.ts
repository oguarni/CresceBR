import {
  DashboardRounded,
  Inventory2Outlined,
  RequestQuoteOutlined,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { TranslationKey } from '../../locales';

export interface SupplierNavItem {
  path: string;
  labelKey: TranslationKey;
  Icon: SvgIconComponent;
}

/**
 * The supplier area's four destinations, shared by the drawer and the fixed
 * bottom bar so the two navigations can never list different places.
 *
 * Order is the display order in both.
 */
export const SUPPLIER_NAV_ITEMS: readonly SupplierNavItem[] = [
  {
    path: '/supplier/dashboard',
    labelKey: 'supplierDashboard.nav.dashboard',
    Icon: DashboardRounded,
  },
  {
    path: '/supplier/quotations',
    labelKey: 'supplierDashboard.nav.quotations',
    Icon: RequestQuoteOutlined,
  },
  { path: '/supplier/orders', labelKey: 'supplierDashboard.nav.orders', Icon: ShoppingBagOutlined },
  {
    path: '/supplier/products',
    labelKey: 'supplierDashboard.nav.catalog',
    Icon: Inventory2Outlined,
  },
];
