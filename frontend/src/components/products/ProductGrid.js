import React from 'react';
import { Plus } from 'lucide-react';

const ProductGrid = ({ products, loading, addToCart }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-4">
            <div className="text-4xl mb-3 text-center">{product.image}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{product.description}</p>
            
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-2xl font-bold text-blue-600">
                R$ {parseFloat(product.price).toFixed(2)}
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
  );
};

export default ProductGrid;