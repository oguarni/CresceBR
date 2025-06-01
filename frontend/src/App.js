import React, { useState, useEffect } from 'react';

import Header from './components/common/Header';
import SearchAndFilters from './components/products/SearchAndFilters';
import ProductGrid from './components/products/ProductGrid';
import ModalsContainer from './components/common/ModalsContainer';
import ErrorMessage from './components/common/ErrorMessage';
import QuoteSuccessMessage from './components/common/QuoteSuccessMessage';

import { useAuth } from './hooks/useAuth';
import { useQuotes } from './hooks/useQuotes';
import { useProducts } from './hooks/useProducts';
import { useForm } from './hooks/useForm';
import { apiService } from './services/api';

function App() {
  const auth = useAuth();
  const quotes = useQuotes();
  const products = useProducts();

  // Forms
  const authForm = useForm({ 
    email: '', 
    password: '', 
    name: '', 
    cnpj: '', 
    companyName: '', 
    role: '', 
    address: '', 
    phone: '',
    sector: ''
  });
  
  const quoteForm = useForm({ 
    quantity: 1,
    urgency: 'normal',
    deliveryAddress: '',
    specifications: '',
    message: ''
  });
  
  const productForm = useForm({ 
    name: '', 
    category: 'Maquinário', 
    price: '', 
    unit: 'unidade', 
    description: '', 
    image: '📦',
    minQuantity: 1
  });

  // UI States
  const [uiState, setUiState] = useState({
    isMenuOpen: false,
    selectedCategory: 'Todas',
    searchTerm: '',
    showQuotes: false,
    showAuth: false,
    showQuoteModal: false,
    showAdmin: false,
    showQuoteSuccess: false,
    showQuoteComparison: false,
    showOrders: false,
    isLogin: true
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const updateUI = (updates) => setUiState(prev => ({ ...prev, ...updates }));

  // Effects
  useEffect(() => {
    products.loadProducts();
    if (auth.user) {
      quotes.loadUserQuotes();
    }
  }, [auth.user]);

  useEffect(() => {
    const filters = {};
    if (uiState.selectedCategory !== 'Todas') filters.category = uiState.selectedCategory;
    if (uiState.searchTerm) filters.search = uiState.searchTerm;
    products.loadProducts(filters);
  }, [uiState.selectedCategory, uiState.searchTerm]);

  // Handlers
  const handleAuth = async () => {
    const success = uiState.isLogin 
      ? await auth.login(authForm.form.email, authForm.form.password)
      : await auth.register(authForm.form);
    
    if (success) {
      updateUI({ showAuth: false });
      authForm.resetForm();
      quotes.loadUserQuotes();
    }
  };

  const handleRequestQuote = (product) => {
    if (!auth.user) {
      updateUI({ showAuth: true });
      return;
    }

    if (!auth.hasPermission('buy')) {
      alert('Apenas compradores podem solicitar cotações');
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
    updateUI({ showQuoteModal: true });
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
      updateUI({ 
        showQuoteModal: false, 
        showQuoteSuccess: true 
      });
      setTimeout(() => {
        updateUI({ showQuoteSuccess: false });
      }, 5000);
      setSelectedProduct(null);
      quoteForm.resetForm();
    }
  };

  const handleProductSubmit = async () => {
    const success = editingProduct
      ? await products.updateProduct(editingProduct.id, productForm.form)
      : await products.createProduct(productForm.form);
    
    if (success) {
      setEditingProduct(null);
      productForm.resetForm();
      products.loadProducts();
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    productForm.setForm({ ...product, price: product.price.toString() });
  };

  const seedData = async () => {
    try {
      await apiService.seedDatabase();
      await products.loadProducts();
      alert('Banco populado com dados B2B!');
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const clearAllErrors = () => {
    auth.clearError();
    products.clearError();
    quotes.clearError();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={auth.user}
        quotes={quotes.quotes}
        getTotalQuotes={quotes.getTotalQuotes}
        setShowQuotes={(show) => updateUI({ showQuotes: show })}
        setShowAuth={(show) => updateUI({ showAuth: show })}
        setShowAdmin={(show) => updateUI({ showAdmin: show })}
        setShowOrders={(show) => updateUI({ showOrders: show })}
        handleLogout={auth.logout}
        seedData={seedData}
        isMenuOpen={uiState.isMenuOpen}
        setIsMenuOpen={(open) => updateUI({ isMenuOpen: open })}
      />

      <ErrorMessage 
        error={auth.error || products.error || quotes.error}
        onClear={clearAllErrors}
      />

      <SearchAndFilters 
        searchTerm={uiState.searchTerm}
        setSearchTerm={(term) => updateUI({ searchTerm: term })}
        selectedCategory={uiState.selectedCategory}
        setSelectedCategory={(cat) => updateUI({ selectedCategory: cat })}
      />

      <div className="container mx-auto px-4 py-8">
        <ProductGrid 
          products={products.products}
          loading={products.loading}
          onRequestQuote={handleRequestQuote}
          user={auth.user}
        />
      </div>

      <ModalsContainer
        uiState={uiState}
        updateUI={updateUI}
        auth={{ ...auth, form: authForm, handleAuth }}
        quotes={{ 
          ...quotes, 
          form: quoteForm, 
          handleSubmitQuote,
          selectedProduct,
          setSelectedProduct
        }}
        products={{ 
          ...products, 
          form: productForm, 
          handleProductSubmit, 
          editProduct, 
          editingProduct, 
          setEditingProduct 
        }}
      />

      <QuoteSuccessMessage 
        show={uiState.showQuoteSuccess}
        quoteId={quotes.lastQuoteId}
      />
    </div>
  );
}

export default App;