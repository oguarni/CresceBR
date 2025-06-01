// components/layout/MainContent.js
import React, { useState } from 'react';
import SearchAndFilters from '../products/SearchAndFilters';
import ProductGrid from '../products/ProductGrid';
import ErrorMessage from '../common/ErrorMessage';
import { useAppContext } from '../../contexts/AppContext';

const MainContent = () => {
  const { 
    uiState, 
    auth, 
    quotes, 
    products,
    quoteForm,
    setSearch, 
    setCategory,
    showModal,
    addNotification,
    clearAllErrors 
  } = useAppContext();

  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleRequestQuote = (product) => {
    if (!auth.user) {
      showModal('showAuth');
      return;
    }

    if (!auth.hasPermission('buy')) {
      addNotification({
        type: 'error',
        message: 'Apenas compradores podem solicitar cotações',
        autoHide: true
      });
      return;
    }

    setSelectedProduct(product);
    quoteForm.setForm({ 
      quantity: product.minQuantity || 1,
      urgency: 'normal',
      deliveryAddress: auth.user.address || '',
      specifications: '',
      message: ''
    });
    showModal('showQuoteModal');
  };

  const handleSubmitQuote = async () => {
    if (!selectedProduct) return;

    const quoteData = {
      productId: selectedProduct.id,
      ...quoteForm.form,
      totalEstimate: selectedProduct.price * quoteForm.form.quantity
    };

    const result = await quotes.createQuote(quoteData);
    if (result.success) {
      showModal('showQuoteSuccess');
      setTimeout(() => {
        showModal('showQuoteSuccess');
      }, 5000);
      setSelectedProduct(null);
      quoteForm.resetForm();
      addNotification({
        type: 'success',
        message: `Cotação ${quotes.lastQuoteId} solicitada com sucesso!`,
        autoHide: true
      });
    }
  };

  return (
    <>
      <ErrorMessage 
        error={auth.error || products.error || quotes.error}
        onClear={clearAllErrors}
      />

      <SearchAndFilters 
        searchTerm={uiState.searchTerm}
        setSearchTerm={setSearch}
        selectedCategory={uiState.selectedCategory}
        setSelectedCategory={setCategory}
      />

      <div className="container mx-auto px-4 py-8">
        <ProductGrid 
          products={products.products}
          loading={products.loading}
          onRequestQuote={handleRequestQuote}
          user={auth.user}
        />
      </div>
    </>
  );
};

export default MainContent;