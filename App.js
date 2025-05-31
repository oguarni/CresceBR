import React, { useState } from 'react';
import { Search, ShoppingCart, Package, User, Menu, X, Plus, Minus, Check, Lock, Edit, Trash2 } from 'lucide-react';

// Mock data
const initialProducts = [
  { id: 1, name: 'Luva Térmica Profissional', category: 'EPI', price: 45.90, unit: 'par', description: 'Luva térmica resistente para uso industrial', image: '🧤' },
  { id: 2, name: 'Óleo Lubrificante Industrial 20L', category: 'Manutenção', price: 189.90, unit: 'balde', description: 'Óleo lubrificante de alta performance', image: '🛢️' },
  { id: 3, name: 'Caixa Térmica EPS 20kg', category: 'Embalagem', price: 35.50, unit: 'unidade', description: 'Caixa térmica isolante para transporte', image: '📦' },
  { id: 4, name: 'Disco de Corte 7"', category: 'Ferramenta', price: 8.90, unit: 'unidade', description: 'Disco de corte para metal e alvenaria', image: '⚙️' },
  { id: 5, name: 'Detergente Industrial 5L', category: 'Limpeza', price: 28.90, unit: 'galão', description: 'Detergente concentrado para limpeza pesada', image: '🧴' },
];

const categories = ['Todas', 'EPI', 'Manutenção', 'Embalagem', 'Ferramenta', 'Limpeza'];

function App() {
  const [products, setProducts] = useState(initialProducts);
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
  
  // Form states
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', cpf: '', address: '' });
  const [checkoutForm, setCheckoutForm] = useState({
    cardNumber: '', cardName: '', cvv: '', expiry: '', cep: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦'
  });
  const [editingProduct, setEditingProduct] = useState(null);

  // Calculate shipping based on CEP
  const calculateShipping = () => {
    const cepPrefix = checkoutForm.cep.substring(0, 2);
    if (cepPrefix >= '80' && cepPrefix <= '87') return 15.90; // Paraná
    if (cepPrefix >= '88' && cepPrefix <= '89') return 25.90; // Santa Catarina
    return 35.90; // Other states
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAuth = () => {
    if (!authForm.email || !authForm.password) return;
    if (!isLogin && (!authForm.name || !authForm.cpf || !authForm.address)) return;
    
    const isAdmin = authForm.email === 'admin@b2bmarketplace.com';
    setUser({ 
      email: authForm.email, 
      name: authForm.name || 'Usuário',
      role: isAdmin ? 'admin' : 'user'
    });
    setShowAuth(false);
    setAuthForm({ email: '', password: '', name: '', cpf: '', address: '' });
  };

  const handleCheckout = () => {
    if (!checkoutForm.cep || !checkoutForm.cardNumber || !checkoutForm.cardName || 
        !checkoutForm.cvv || !checkoutForm.expiry) return;
    
    const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setOrderId(newOrderId);
    setShowCheckout(false);
    setShowOrderSuccess(true);
    setTimeout(() => {
      setShowOrderSuccess(false);
      setCart([]);
    }, 5000);
  };

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price || !productForm.description) return;
    
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...productForm, id: editingProduct.id, price: parseFloat(productForm.price) }
          : p
      ));
      setEditingProduct(null);
    } else {
      const newProduct = {
        ...productForm,
        id: Date.now(),
        price: parseFloat(productForm.price)
      };
      setProducts([...products, newProduct]);
    }
    setProductForm({ name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦' });
  };

  const deleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ ...product, price: product.price.toString() });
  };

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
  const getTotalValue = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-xl font-bold">B2B Marketplace</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:text-blue-200">Fornecedores</a>
              <a href="#" className="hover:text-blue-200">Como Funciona</a>
              {user?.role === 'admin' && (
                <button onClick={() => setShowAdmin(true)} className="hover:text-blue-200">
                  Admin
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCart(true)}
                className="relative bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline">Carrinho</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                  <button 
                    onClick={() => setUser(null)}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuth(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <User size={20} className="inline mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search and Categories */}
      <div className="bg-white shadow-sm sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="text-4xl mb-3 text-center">{product.image}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">/{product.unit}</span>
                </div>
                
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Adicionar ao Carrinho</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            <h2 className="text-2xl font-bold mb-6">{isLogin ? 'Login' : 'Cadastro'}</h2>
            <div>
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="w-full mb-4 px-4 py-2 border rounded-lg"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                />
              )}
              <input
                type="email"
                placeholder="Email"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
              />
              <input
                type="password"
                placeholder="Senha"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />
              {!isLogin && (
                <>
                  <input
                    type="text"
                    placeholder="CPF"
                    className="w-full mb-4 px-4 py-2 border rounded-lg"
                    value={authForm.cpf}
                    onChange={(e) => setAuthForm({...authForm, cpf: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Endereço"
                    className="w-full mb-4 px-4 py-2 border rounded-lg"
                    value={authForm.address}
                    onChange={(e) => setAuthForm({...authForm, address: e.target.value})}
                  />
                </>
              )}
              <button 
                onClick={handleAuth}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                {isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
              <p className="text-center mt-4 text-sm">
                {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 ml-1 hover:underline"
                >
                  {isLogin ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>
              <p className="text-xs text-gray-600 mt-4 text-center">
                Admin: admin@b2bmarketplace.com / 123456
              </p>
            </div>
            <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Seu Carrinho</h2>
                <button onClick={() => setShowCart(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-16 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-semibold">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t p-4">
                  <div className="flex justify-between mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {getTotalValue().toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Finalizar Compra
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Finalizar Compra</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>R$ {getTotalValue().toFixed(2)}</span>
                </div>
                {checkoutForm.cep && (
                  <div className="flex justify-between mb-2">
                    <span>Frete:</span>
                    <span>R$ {calculateShipping().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {(getTotalValue() + (checkoutForm.cep ? calculateShipping() : 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="CEP para calcular frete"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={checkoutForm.cep}
                onChange={(e) => setCheckoutForm({...checkoutForm, cep: e.target.value})}
              />
              
              <input
                type="text"
                placeholder="Número do Cartão"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={checkoutForm.cardNumber}
                onChange={(e) => setCheckoutForm({...checkoutForm, cardNumber: e.target.value})}
              />
              
              <input
                type="text"
                placeholder="Nome no Cartão"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={checkoutForm.cardName}
                onChange={(e) => setCheckoutForm({...checkoutForm, cardName: e.target.value})}
              />
              
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="MM/AA"
                  className="flex-1 px-4 py-2 border rounded-lg"
                  value={checkoutForm.expiry}
                  onChange={(e) => setCheckoutForm({...checkoutForm, expiry: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="CVV"
                  className="flex-1 px-4 py-2 border rounded-lg"
                  value={checkoutForm.cvv}
                  onChange={(e) => setCheckoutForm({...checkoutForm, cvv: e.target.value})}
                />
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mb-4"
              >
                <Lock size={20} className="inline mr-2" />
                Confirmar Pagamento
              </button>
              
              <p className="text-xs text-gray-600 text-center">
                Esta é uma simulação. Nenhum pagamento real será processado.
              </p>
            </div>
            
            <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4">
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdmin && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Painel Administrativo</h2>
                <button onClick={() => setShowAdmin(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Product Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-4">
                  {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome do produto"
                    className="px-4 py-2 border rounded-lg"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                  <select
                    className="px-4 py-2 border rounded-lg"
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  >
                    {categories.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Preço"
                    className="px-4 py-2 border rounded-lg"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Unidade"
                    className="px-4 py-2 border rounded-lg"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Emoji do produto"
                    className="px-4 py-2 border rounded-lg"
                    value={productForm.image}
                    onChange={(e) => setProductForm({...productForm, image: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Descrição"
                    className="px-4 py-2 border rounded-lg md:col-span-1"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleProductSubmit}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingProduct ? 'Atualizar' : 'Adicionar'}
                  </button>
                  {editingProduct && (
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({ name: '', category: 'EPI', price: '', unit: 'unidade', description: '', image: '📦' });
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Products List */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Produto</th>
                      <th className="border p-2 text-left">Categoria</th>
                      <th className="border p-2 text-left">Preço</th>
                      <th className="border p-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td className="border p-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{product.image}</span>
                            <div>
                              <div className="font-semibold">{product.name}</div>
                              <div className="text-sm text-gray-600">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="border p-2">{product.category}</td>
                        <td className="border p-2">R$ {product.price.toFixed(2)}</td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editProduct(product)}
                              className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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