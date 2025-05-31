import React, { useState } from 'react';
import { Search, ShoppingCart, Package, User, Menu, X, Plus, Minus, Check } from 'lucide-react';

// Dados mock para funcionar sem backend
const mockProducts = [
  {
    id: 1,
    name: 'Luva Térmica Profissional',
    category: 'EPI',
    price: 45.90,
    unit: 'par',
    supplier: 'EPI Sul',
    minOrder: 10,
    image: '🧤'
  },
  {
    id: 2,
    name: 'Óleo Lubrificante Industrial 20L',
    category: 'Manutenção',
    price: 189.90,
    unit: 'balde',
    supplier: 'Lubrimax',
    minOrder: 1,
    image: '🛢️'
  },
  {
    id: 3,
    name: 'Caixa Térmica EPS 20kg',
    category: 'Embalagem',
    price: 35.50,
    unit: 'unidade',
    supplier: 'Embala PR',
    minOrder: 50,
    image: '📦'
  },
  {
    id: 4,
    name: 'Disco de Corte 7"',
    category: 'Ferramenta',
    price: 8.90,
    unit: 'unidade',
    supplier: 'Ferramentas DV',
    minOrder: 20,
    image: '⚙️'
  },
  {
    id: 5,
    name: 'Detergente Industrial 5L',
    category: 'Limpeza',
    price: 28.90,
    unit: 'galão',
    supplier: 'Química Oeste',
    minOrder: 4,
    image: '🧴'
  }
];

const categories = ['Todas', 'EPI', 'Manutenção', 'Embalagem', 'Ferramenta', 'Limpeza'];

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showQuoteSuccess, setShowQuoteSuccess] = useState(false);

  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + product.minOrder }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: product.minOrder }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(item.minOrder, item.quantity + delta);
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

  const requestQuote = () => {
    setShowQuoteSuccess(true);
    setTimeout(() => {
      setShowQuoteSuccess(false);
      setCart([]);
      setShowCart(false);
    }, 3000);
  };

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
              <a href="#" className="hover:text-blue-200">Contato</a>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCart(true)}
                className="relative bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline">Cotação</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                <User size={20} className="inline mr-2" />
                <span className="hidden sm:inline">Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-blue-700 px-4 py-3 space-y-2">
            <a href="#" className="block py-2 hover:text-blue-200">Fornecedores</a>
            <a href="#" className="block py-2 hover:text-blue-200">Como Funciona</a>
            <a href="#" className="block py-2 hover:text-blue-200">Contato</a>
          </div>
        )}
      </header>

      {/* Search and Categories */}
      <div className="bg-white shadow-sm sticky top-14 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar produtos para sua empresa..."
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cotação Rápida para sua Empresa
          </h2>
          <p className="text-xl mb-6">
            Compare preços de múltiplos fornecedores em segundos
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              ✓ Entrega Garantida
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              ✓ Pagamento 30 dias
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              ✓ Fornecedores verificados
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
                <p className="text-sm text-gray-600 mb-3">Fornecedor: {product.supplier}</p>
                
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">/{product.unit}</span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  Pedido mínimo: {product.minOrder} {product.unit}s
                </div>
                
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Adicionar à Cotação</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sua Cotação</h2>
                <button onClick={() => setShowCart(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>Sua cotação está vazia</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.supplier}</p>
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
                            onClick={() => updateQuantity(item.id, -item.minOrder)}
                            className="bg-gray-200 p-1 rounded hover:bg-gray-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-16 text-center">
                            {item.quantity} {item.unit}s
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.minOrder)}
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
                    <span className="text-lg font-semibold">Total Estimado:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {getTotalValue().toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={requestQuote}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Solicitar Cotação
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Você receberá propostas de todos os fornecedores em até 24h
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Message */}
      {showQuoteSuccess && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <Check size={24} />
          <span>Cotação enviada com sucesso!</span>
        </div>
      )}
    </div>
  );
}

export default App;
