import React from 'react';
import { Chip } from '@mui/material';
import { Cancel, CheckCircle, Schedule, Warning } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import { availabilityColor, type ProductAvailability } from '../../utils/supplierProducts';

interface ProductAvailabilityChipProps {
  /** Narrowed rather than `string` so the dictionary key below type-checks. */
  availability: ProductAvailability;
  /** The table variant is icon-free, matching the denser row layout. */
  withIcon?: boolean;
}

const AVAILABILITY_ICONS: Record<ProductAvailability, React.ReactElement> = {
  in_stock: <CheckCircle />,
  limited: <Warning />,
  out_of_stock: <Cancel />,
  custom_order: <Schedule />,
};

/**
 * Stock badge shared by the card grid and the table.
 *
 * Replaces the previous `availability.replace('_', ' ')`, which rendered the
 * raw database value and stayed English in every language.
 *
 * @example
 * <ProductAvailabilityChip availability={product.availability} withIcon />
 */
export const ProductAvailabilityChip: React.FC<ProductAvailabilityChipProps> = ({
  availability,
  withIcon,
}) => {
  const t = useT();

  return (
    <Chip
      label={t(`supplierProducts.availability.${availability}`)}
      color={availabilityColor(availability)}
      size='small'
      icon={withIcon ? AVAILABILITY_ICONS[availability] : undefined}
    />
  );
};
