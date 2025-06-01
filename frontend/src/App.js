import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

import Header from './components/common/Header';
import SearchAndFilters from './components/products/SearchAndFilters';
import ProductGrid from './components/products/ProductGrid';
import AuthModal from './components/auth/AuthModal';
import CartSidebar from './components/cart/CartSidebar';
import CheckoutModal from './components/cart/CheckoutModal';
import AdminPanel from './components/admin/AdminPanel';

import { apiService } from './services/api';
import { calculateShipping } from './utils/constants';

function App() {
  // States
  const [products, setProducts] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', cpf: '', address: '' });
  const [checkoutForm, setCheckoutForm] = useState({
    cardNumber: '', cardName: '', cvv: '', expiry: '', cep: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦'
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // Effects
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchTerm]);

  // API Functions
  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedCategory !== 'Todas') filters.category = selectedCategory;
      if (searchTerm) filters.search = searchTerm;
      
      const data = await apiService.getProducts(filters);
      setProducts(data.products);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (isLogin) {
        const data = await apiService.login(authForm.email, authForm.password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        const data = await apiService.register(authForm);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      
      setShowAuth(false);
      setAuthForm({ email: '', password: '', name: '', cpf: '', address: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        cep: checkoutForm.cep,
        paymentMethod: 'credit_card'
      };

      const data = await apiService.createOrder(orderData);
      setOrderId(data.order.orderNumber);
      setShowCheckout(false);
      setShowOrderSuccess(true);
      setTimeout(() => {
        setShowOrderSuccess(false);
        setCart([]);
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async () => {
    try {
      setLoading(true);
      
      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, productForm);
        setEditingProduct(null);
      } else {
        await apiService.createProduct(productForm);
      }
      
      setProductForm({ name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦' });
      await loadProducts();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiService.deleteProduct(id);
      await loadProducts();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao deletar produto');
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ ...product, price: product.price.toString() });
  };

  // Cart Functions
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalItems = () => cart.reduce((total, item) => total + item.quantity, 0);
  const getTotalValue = () => cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);

  const seedData = async () => {
    try {
      setLoading(true);
      await apiService.seedDatabase();
      await loadProducts();
      alert('Banco de dados populado com sucesso!');
    } catch (error) {
      setError('Erro ao popular banco de dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        cart={cart}
        getTotalItems={getTotalItems}
        setShowCart={setShowCart}
        setShowAuth={setShowAuth}
        setShowAdmin={setShowAdmin}
        handleLogout={handleLogout}
        seedData={seedData}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white px-4 py-2 text-center">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">Fechar</button>
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
          products={products}
          loading={loading}
          addToCart={addToCart}
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
        loading={loading}
      />

      <CartSidebar 
        showCart={showCart}
        setShowCart={setShowCart}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        getTotalValue={getTotalValue}
        user={user}
        setShowCheckout={setShowCheckout}
        setShowAuth={setShowAuth}
      />

      <CheckoutModal 
        showCheckout={showCheckout}
        setShowCheckout={setShowCheckout}
        checkoutForm={checkoutForm}
        setCheckoutForm={setCheckoutForm}
        getTotalValue={getTotalValue}
        calculateShipping={calculateShipping}
        handleCheckout={handleCheckout}
        loading={loading}
      />

      <AdminPanel 
        showAdmin={showAdmin}
        setShowAdmin={setShowAdmin}
        user={user}
        productForm={productForm}
        setProductForm={setProductForm}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        handleProductSubmit={handleProductSubmit}
        products={products}
        editProduct={editProduct}
        deleteProduct={deleteProduct}
        loading={loading}
      />

      {/* Order Success Message */}
      {showOrderSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Check size={24} />
            <span className="font-semibold">Pedido realizado com sucesso!</span>
          </div>
          <p className="text-sm">ID do Pedido: {orderId}</p>
          <p className="text-xs mt-1">Você receberá um email de confirmação em breve.</p>
        </div>
      )}
    </div>
  );
}

export default App;
