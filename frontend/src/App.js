import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

import Header from './components/common/Header';
import SearchAndFilters from './components/products/SearchAndFilters';
import ProductGrid from './components/products/ProductGrid';
import AuthModal from './components/auth/AuthModal';
import CartSidebar from './components/cart/CartSidebar';
import CheckoutModal from './components/cart/CheckoutModal';
import AdminPanel from './components/admin/AdminPanel';

import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { apiService } from './services/api';

function App() {
  // Custom hooks
  const auth = useAuth();
  const cart = useCart();
  const products = useProducts();
  const orders = useOrders();

  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Form states
  const [authForm, setAuthForm] = useState({ 
    email: '', password: '', name: '', cpf: '', address: '' 
  });
  const [checkoutForm, setCheckoutForm] = useState({
    cardNumber: '', cardName: '', cvv: '', expiry: '', cep: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦'
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // Effects
  useEffect(() => {
    products.loadProducts();
  }, []);

  useEffect(() => {
    const filters = {};
    if (selectedCategory !== 'Todas') filters.category = selectedCategory;
    if (searchTerm) filters.search = searchTerm;
    products.loadProducts(filters);
  }, [selectedCategory, searchTerm]);

  // Handlers
  const handleAuth = async () => {
    const success = isLogin 
      ? await auth.login(authForm.email, authForm.password)
      : await auth.register(authForm);
    
    if (success) {
      setShowAuth(false);
      setAuthForm({ email: '', password: '', name: '', cpf: '', address: '' });
    }
  };

  const handleCheckout = async () => {
    const orderData = {
      items: cart.cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      cep: checkoutForm.cep,
      paymentMethod: 'credit_card'
    };

    const result = await orders.createOrder(orderData);
    if (result.success) {
      setShowCheckout(false);
      setShowOrderSuccess(true);
      setTimeout(() => {
        setShowOrderSuccess(false);
        cart.clearCart();
      }, 5000);
    }
  };

  const handleProductSubmit = async () => {
    const success = editingProduct
      ? await products.updateProduct(editingProduct.id, productForm)
      : await products.createProduct(productForm);
    
    if (success) {
      setEditingProduct(null);
      setProductForm({ 
        name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦' 
      });
      products.loadProducts();
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ ...product, price: product.price.toString() });
  };

  const seedData = async () => {
    try {
      await apiService.seedDatabase();
      await products.loadProducts();
      alert('Banco de dados populado com sucesso!');
    } catch (error) {
      console.error('Erro ao popular banco:', error);
    }
  };

  const error = auth.error || products.error || orders.error;
  const loading = auth.loading || products.loading || orders.loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={auth.user}
        cart={cart.cart}
        getTotalItems={cart.getTotalItems}
        setShowCart={setShowCart}
        setShowAuth={setShowAuth}
        setShowAdmin={setShowAdmin}
        handleLogout={auth.logout}
        seedData={seedData}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 text-center">
          {error}
          <button onClick={() => {
            auth.clearError();
            products.clearError();
            orders.clearError();
          }} className="ml-4 underline">
            Fechar
          </button>
        </div>
      )}

      <SearchAndFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <div className="container mx-auto px-4 py-8">
        <ProductGrid 
          products={products.products}
          loading={products.loading}
          addToCart={cart.addToCart}
        />
      </div>

      {/* Modals */}
      <AuthModal 
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleAuth={handleAuth}
        loading={auth.loading}
      />

      <CartSidebar 
        showCart={showCart}
        setShowCart={setShowCart}
        cart={cart.cart}
        updateQuantity={cart.updateQuantity}
        removeFromCart={cart.removeFromCart}
        getTotalValue={cart.getTotalValue}
        user={auth.user}
        setShowCheckout={setShowCheckout}
        setShowAuth={setShowAuth}
      />

      <CheckoutModal 
        showCheckout={showCheckout}
        setShowCheckout={setShowCheckout}
        checkoutForm={checkoutForm}
        setCheckoutForm={setCheckoutForm}
        getTotalValue={cart.getTotalValue}
        handleCheckout={handleCheckout}
        loading={orders.loading}
      />

      <AdminPanel 
        showAdmin={showAdmin}
        setShowAdmin={setShowAdmin}
        user={auth.user}
        productForm={productForm}
        setProductForm={setProductForm}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        handleProductSubmit={handleProductSubmit}
        products={products.products}
        editProduct={editProduct}
        deleteProduct={products.deleteProduct}
        loading={products.loading}
      />

      {/* Order Success Message */}
      {showOrderSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Check size={24} />
            <span className="font-semibold">Pedido realizado com sucesso!</span>
          </div>
          <p className="text-sm">ID do Pedido: {orders.lastOrderId}</p>
          <p className="text-xs mt-1">Você receberá um email de confirmação em breve.</p>
        </div>
      )}
    </div>
  );
}

export default App;
