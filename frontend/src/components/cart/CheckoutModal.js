import React from 'react';
import { X, Lock } from 'lucide-react';

const CheckoutModal = ({ 
  showCheckout, 
  setShowCheckout, 
  checkoutForm, 
  setCheckoutForm, 
  getTotalValue, 
  calculateShipping, 
  handleCheckout, 
  loading 
}) => {
  if (!showCheckout) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheckout();
  };

  const shippingCost = checkoutForm.cep ? calculateShipping(checkoutForm.cep) : 0;
  const totalWithShipping = getTotalValue() + shippingCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative max-h-screen overflow-y-auto">
        <button 
          onClick={() => setShowCheckout(false)} 
          className="absolute top-4 right-4"
        >
          <X size={24} />
        </button>
        
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
                <span>R$ {shippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total:</span>
              <span>R$ {totalWithShipping.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="CEP para calcular frete"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={checkoutForm.cep}
            onChange={(e) => setCheckoutForm({...checkoutForm, cep: e.target.value})}
            required
          />
          
          <input
            type="text"
            placeholder="Número do Cartão"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={checkoutForm.cardNumber}
            onChange={(e) => setCheckoutForm({...checkoutForm, cardNumber: e.target.value})}
            required
          />
          
          <input
            type="text"
            placeholder="Nome no Cartão"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={checkoutForm.cardName}
            onChange={(e) => setCheckoutForm({...checkoutForm, cardName: e.target.value})}
            required
          />
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="MM/AA"
              className="flex-1 px-4 py-2 border rounded-lg"
              value={checkoutForm.expiry}
              onChange={(e) => setCheckoutForm({...checkoutForm, expiry: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="CVV"
              className="flex-1 px-4 py-2 border rounded-lg"
              value={checkoutForm.cvv}
              onChange={(e) => setCheckoutForm({...checkoutForm, cvv: e.target.value})}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mb-4 disabled:opacity-50"
            disabled={loading}
          >
            <Lock size={20} className="inline mr-2" />
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </form>
        
        <p className="text-xs text-gray-600 text-center">
          Esta é uma simulação. Nenhum pagamento real será processado.
        </p>
      </div>
    </div>
  );
};

export default CheckoutModal;