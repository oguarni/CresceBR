import React from 'react';
import { Box, Card, Divider, Typography } from '@mui/material';
import {
  Inventory2Outlined,
  LocalShipping,
  PrecisionManufacturingOutlined,
} from '@mui/icons-material';
import type { Order } from '@shared/types';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../locales';
import { formatBRL } from '../../utils/currency';
import { orderProgressStyle } from '../../utils/supplierDashboard';

interface SupplierRecentOrdersProps {
  orders: Order[];
  dateLocale: string;
  onOpenOrders: () => void;
}

const STATUS_ICONS: Record<string, typeof LocalShipping> = {
  delivered: LocalShipping,
  processing: PrecisionManufacturingOutlined,
};

const SECTION_TITLE_SX = {
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'text.secondary',
} as const;

/**
 * Recent orders with a fulfilment progress bar, each opening the orders screen.
 *
 * @example
 * <SupplierRecentOrders
 *   orders={recentOrders}
 *   dateLocale='pt-BR'
 *   onOpenOrders={() => navigate('/supplier/orders')}
 * />
 */
export const SupplierRecentOrders: React.FC<SupplierRecentOrdersProps> = ({
  orders,
  dateLocale,
  onOpenOrders,
}) => {
  const t = useT();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='subtitle2' sx={SECTION_TITLE_SX}>
          {t('supplierDashboard.recentOrders')}
        </Typography>
      </Box>

      <Card
        variant='outlined'
        sx={{ borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {orders.map((order, index) => {
          const style = orderProgressStyle(order.status);
          const Icon = STATUS_ICONS[order.status] ?? Inventory2Outlined;

          return (
            <React.Fragment key={order.id}>
              {index > 0 && <Divider />}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={onOpenOrders}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: style.iconBg,
                    color: style.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <Typography
                      variant='body2'
                      noWrap
                      sx={{ fontWeight: 600, color: 'text.primary' }}
                    >
                      {t('supplierDashboard.orderLabel', { id: order.id })}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                    >
                      {formatBRL(order.totalAmount)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 0.5,
                    }}
                  >
                    <Box sx={{ width: 96 }}>
                      <Box
                        sx={{
                          height: 4,
                          width: '100%',
                          bgcolor: 'grey.200',
                          borderRadius: 2,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            bgcolor: style.color,
                            width: `${style.progress}%`,
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                      <Typography
                        variant='caption'
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          fontSize: '0.625rem',
                          color: 'text.secondary',
                        }}
                      >
                        {t(`supplierDashboard.orderStatus.${order.status}` as TranslationKey)}
                      </Typography>
                    </Box>
                    <Typography
                      variant='caption'
                      sx={{ fontSize: '0.625rem', color: 'text.secondary' }}
                    >
                      {new Date(order.createdAt || Date.now()).toLocaleDateString(dateLocale)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </React.Fragment>
          );
        })}
      </Card>
    </Box>
  );
};
