import React from 'react';
import { Check } from 'lucide-react';

const OrderSuccessMessage = ({ show, orderId }) => {
  if (!show) return null;
  
  return (
    <div className="fixed top-20 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Check size={24} />
        <span className="font-semibold">Pedido realizado!</span>
      </div>
      <p className="text-sm">ID: {orderId}</p>
    </div>
  );
};

export default OrderSuccessMessage;