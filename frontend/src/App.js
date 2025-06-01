import React, { useState, useEffect } from 'react';

import Header from './components/common/Header';
import SearchAndFilters from './components/products/SearchAndFilters';
import ProductGrid from './components/products/ProductGrid';
import ModalsContainer from './components/common/ModalsContainer';
import ErrorMessage from './components/common/ErrorMessage';
import OrderSuccessMessage from './components/common/OrderSuccessMessage';

import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { useForm } from './hooks/useForm';
import { apiService } from './services/api';

function App() {
  const auth = useAuth();
  const cart = useCart();
  const products = useProducts();
  const orders = useOrders();

  // Forms
  const authForm = useForm({ email: '', password: '', name: '', cpf: '', address: '' });
  const checkoutForm = useForm({ cardNumber: '', cardName: '', cvv: '', expiry: '', cep: '' });
  const productForm = useForm({ name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦' });

  // UI States
  const [uiState, setUiState] = useState({
    isMenuOpen: false,
    selectedCategory: 'Todas',
    searchTerm: '',
    showCart: false,
    showAuth: false,
    showCheckout: false,
    showAdmin: false,
    showOrderSuccess: false,
    isLogin: true
  });

  const [editingProduct, setEditingProduct] = useState(null);

  const updateUI = (updates) => setUiState(prev => ({ ...prev, ...updates }));

  // Effects
  useEffect(() => products.loadProducts(), []);

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
    }
  };

  const handleCheckout = async () => {
    const orderData = {
      items: cart.cart.map(item => ({ productId: item.id, quantity: item.quantity })),
      cep: checkoutForm.form.cep,
      paymentMethod: 'credit_card'
    };

    const result = await orders.createOrder(orderData);
    if (result.success) {
      updateUI({ showCheckout: false, showOrderSuccess: true });
      setTimeout(() => {
        updateUI({ showOrderSuccess: false });
        cart.clearCart();
      }, 5000);
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
      alert('Banco populado!');
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const clearAllErrors = () => {
    auth.clearError();
    products.clearError();
    orders.clearError();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={auth.user}
        cart={cart.cart}
        getTotalItems={cart.getTotalItems}
        setShowCart={(show) => updateUI({ showCart: show })}
        setShowAuth={(show) => updateUI({ showAuth: show })}
        setShowAdmin={(show) => updateUI({ showAdmin: show })}
        handleLogout={auth.logout}
        seedData={seedData}
        isMenuOpen={uiState.isMenuOpen}
        setIsMenuOpen={(open) => updateUI({ isMenuOpen: open })}
      />

      <ErrorMessage 
        error={auth.error || products.error || orders.error}
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
          addToCart={cart.addToCart}
        />
      </div>

      <ModalsContainer
        uiState={uiState}
        updateUI={updateUI}
        auth={{ ...auth, form: authForm, handleAuth }}
        cart={{ ...cart, form: checkoutForm, handleCheckout }}
        products={{ ...products, form: productForm, handleProductSubmit, editProduct, editingProduct, setEditingProduct }}
        orders={orders}
      />

      <OrderSuccessMessage 
        show={uiState.showOrderSuccess}
        orderId={orders.lastOrderId}
      />
    </div>
  );
}

export default App;
