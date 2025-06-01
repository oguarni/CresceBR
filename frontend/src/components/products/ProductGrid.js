import React, { memo, useMemo } from 'react';
import { FileText, Building, Package } from 'lucide-react';

const ProductCard = memo(({ product, onRequestQuote, user }) => {
  const canRequestQuote = useMemo(() => 
    user && (user.role === 'buyer' || user.role === 'admin'), 
    [user]
  );

  const isSupplier = useMemo(() => 
    user && user.role === 'supplier', 
    [user]
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      <div className="p-4">
        <div className="text-4xl mb-3 text-center bg-gray-50 py-4 rounded-lg">
          {product.image}
        </div>
        
        <div className="mb-3">
          <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
          <p className="text-xs text-blue-600 mb-2">
            <span className="inline-flex items-center">
              <Building size={12} className="mr-1" />
              {product.supplier || 'Fornecedor'}
            </span>
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        </div>
        
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {product.category}
          </span>
        </div>
        
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-blue-600">
              R$ {parseFloat(product.price).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/{product.unit}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Package size={14} className="mr-1" />
            <span>Qtd. mínima: {product.minQuantity || 1} {product.unit}</span>
          </div>
          {product.leadTime && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span>Prazo: {product.leadTime} dias</span>
            </div>
          )}
        </div>
        
        {canRequestQuote ? (
          <button
            onClick={() => onRequestQuote(product)}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FileText size={18} />
            <span>Solicitar Cotação</span>
          </button>
        ) : isSupplier ? (
          <div className="w-full bg-gray-100 text-gray-500 py-2 rounded-lg text-center text-sm">
            Produto do fornecedor
          </div>
        ) : (
          <button
            onClick={() => onRequestQuote && onRequestQuote(null)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <FileText size={18} />
            <span>Fazer Login para Cotar</span>
          </button>
        )}
        
        {product.inStock !== undefined && (
          <div className="mt-2 text-xs text-center">
            <span className={`inline-flex items-center px-2 py-1 rounded-full ${
              product.inStock 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.inStock ? '✓ Disponível' : '⚠ Consultar disponibilidade'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

const ProductGrid = ({ products, loading, onRequestQuote, user }) => {
  const memoizedProducts = useMemo(() => products, [products]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-b-2 border-blue-600"></div>
        <p className="mt-2">Carregando produtos...</p>
      </div>
    );
  }

  if (memoizedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto mb-4 text-gray-400" size={64} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-500">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {memoizedProducts.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onRequestQuote={onRequestQuote} 
          user={user} 
        />
      ))}
    </div>
  );
};

export default memo(ProductGrid);