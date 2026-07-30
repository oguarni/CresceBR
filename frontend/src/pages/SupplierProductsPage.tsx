import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Fab,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Add, FileDownload, FileUpload } from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { Product } from '@shared/types';
import { useT } from '../contexts/LanguageContext';
import { useSupplierProductCatalog } from '../hooks/useSupplierProductCatalog';
import { ProductStatsCards } from '../components/products/ProductStatsCards';
import { ProductFilterBar, type ProductViewMode } from '../components/products/ProductFilterBar';
import { ProductCardGrid } from '../components/products/ProductCardGrid';
import { ProductTable } from '../components/products/ProductTable';
import { ProductFormDialog } from '../components/products/ProductFormDialog';
import {
  EMPTY_PRODUCT_FILTERS,
  EMPTY_PRODUCT_FORM,
  groupProductsByStock,
  matchesProductFilters,
  productFormFromProduct,
  PRODUCT_TAB_KEYS,
  type ProductFilters,
  type ProductFormData,
} from '../utils/supplierProducts';

/**
 * The supplier's catalogue: filterable, viewable as cards or a table, grouped by
 * stock status into tabs, with a create/edit dialog.
 *
 * Data access lives in `useSupplierProductCatalog`, filter and status rules in
 * `utils/supplierProducts`, and each UI block in its own component.
 */
const SupplierProductsPage: React.FC = () => {
  const t = useT();
  const { products, categories, loading, saveProduct, deleteProduct } = useSupplierProductCatalog();

  const [viewMode, setViewMode] = useState<ProductViewMode>('grid');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_PRODUCT_FORM);

  const productsByStock = groupProductsByStock(
    products.filter(product => matchesProductFilters(product, filters))
  );
  const activeTab = PRODUCT_TAB_KEYS[selectedTab] ?? 'all';
  const displayProducts = productsByStock[activeTab];

  const handleFilterChange = <K extends keyof ProductFilters>(field: K, value: ProductFilters[K]) =>
    setFilters(previous => ({ ...previous, [field]: value }));

  const handleFormChange = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) =>
    setForm(previous => ({ ...previous, [field]: value }));

  const handleCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_PRODUCT_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm(productFormFromProduct(product));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Keep the dialog open on failure so the entered details are not lost.
    if (await saveProduct(form, editingProduct)) setDialogOpen(false);
  };

  const handleDelete = (productId: number) => {
    if (!window.confirm(t('supplierProducts.toast.deleteConfirm'))) return;
    deleteProduct(productId);
  };

  // CSV import/export are not implemented yet; the handlers exist so the
  // controls can stay visible and announce that rather than silently no-op.
  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    toast(t('supplierProducts.toast.importSoon'));
    event.target.value = '';
  };

  return (
    <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            {t('supplierProducts.title')}
          </Typography>
          <Typography variant='subtitle1' color='text.secondary'>
            {t('supplierProducts.subtitle')}
          </Typography>
        </Box>
        <Box display='flex' gap={2}>
          <Button
            variant='outlined'
            startIcon={<FileDownload />}
            onClick={() => toast(t('supplierProducts.toast.exportSoon'))}
          >
            {t('supplierProducts.exportCsv')}
          </Button>
          <input
            type='file'
            accept='.csv'
            onChange={handleCsvImport}
            style={{ display: 'none' }}
            id='csv-import'
          />
          <label htmlFor='csv-import'>
            <Button variant='outlined' component='span' startIcon={<FileUpload />}>
              {t('supplierProducts.importCsv')}
            </Button>
          </label>
          <Button variant='contained' startIcon={<Add />} onClick={handleCreate}>
            {t('supplierProducts.addProduct')}
          </Button>
        </Box>
      </Box>

      <ProductStatsCards products={products} />

      <ProductFilterBar
        filters={filters}
        categories={categories}
        viewMode={viewMode}
        onFilterChange={handleFilterChange}
        onViewModeChange={setViewMode}
      />

      {loading ? (
        <Box display='flex' justifyContent='center' mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Driven from PRODUCT_TAB_KEYS so the tabs and the grouped buckets cannot drift apart. */}
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ mb: 2 }}
          >
            {PRODUCT_TAB_KEYS.map(key => (
              <Tab
                key={key}
                label={`${t(`supplierProducts.tabs.${key}`)} (${productsByStock[key].length})`}
              />
            ))}
          </Tabs>

          {displayProducts.length === 0 ? (
            <Alert severity='info' sx={{ mt: 2 }}>
              {t(`supplierProducts.empty.${activeTab}`)}
            </Alert>
          ) : viewMode === 'grid' ? (
            <ProductCardGrid
              products={displayProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <ProductTable products={displayProducts} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </>
      )}

      <ProductFormDialog
        open={dialogOpen}
        isEditing={Boolean(editingProduct)}
        form={form}
        categories={categories}
        onChange={handleFormChange}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />

      <Fab
        color='primary'
        aria-label={t('supplierProducts.addProductAria')}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreate}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default SupplierProductsPage;
