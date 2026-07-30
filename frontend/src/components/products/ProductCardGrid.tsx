import React from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import type { Product } from '@shared/types';
import { useT } from '../../contexts/LanguageContext';
import { formatBRL } from '../../utils/currency';
import { ProductAvailabilityChip } from './ProductAvailabilityChip';

interface ProductCardGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
}

export const PRODUCT_IMAGE_FALLBACK = '/placeholder-product.jpg';

/**
 * Card view of the catalogue, one tile per product.
 *
 * @example
 * <ProductCardGrid products={displayProducts} onEdit={openEdit} onDelete={remove} />
 */
export const ProductCardGrid: React.FC<ProductCardGridProps> = ({ products, onEdit, onDelete }) => {
  const t = useT();

  return (
    <Grid container spacing={3}>
      {products.map(product => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
          <Card>
            <CardMedia
              component='img'
              height='200'
              image={product.imageUrl || PRODUCT_IMAGE_FALLBACK}
              alt={product.name}
            />
            <CardContent>
              <Typography variant='h6' noWrap title={product.name}>
                {product.name}
              </Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {product.description}
              </Typography>
              <Box mt={1} mb={1}>
                <ProductAvailabilityChip availability={product.availability} withIcon />
              </Box>
              <Typography variant='h6' color='primary'>
                {formatBRL(product.price)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {t('supplierProducts.moq', { quantity: product.minimumOrderQuantity })}
              </Typography>
            </CardContent>
            <CardActions>
              <IconButton
                onClick={() => onEdit(product)}
                size='small'
                aria-label={t('supplierProducts.editAria', { name: product.name })}
              >
                <Edit />
              </IconButton>
              <IconButton
                onClick={() => onDelete(product.id)}
                size='small'
                aria-label={t('supplierProducts.deleteAria', { name: product.name })}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
