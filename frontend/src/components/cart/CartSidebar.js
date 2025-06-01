import React from 'react';
import { X, ShoppingCart, Plus, Minus } from 'lucide-react';

const CartSidebar = ({ 
  showCart, 
  setShowCart, 
  cart, 
  updateQuantity, 
  removeFromCart, 
  getTotalValue, 
  user, 
  setShowCheckout, 
  setShowAuth 
}) => {
  if (!showCart) return null;

  const handleCheckout = () => {
    if (!user) {
      setShowCart(false);
      setShowAuth(true);
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  return (
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
                      R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
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
                onClick={handleCheckout}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {user ? 'Finalizar Compra' : 'Login para Comprar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;