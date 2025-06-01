import React, { memo, useMemo, useCallback, Suspense } from 'react';
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';
import LoadingSpinner from '../common/LoadingSpinner';

// Lazy loading para componentes pesados
const ProductGridSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse h-96">
        <div className="p-4 h-full flex flex-col">
          <div className="h-20 bg-gray-200 rounded-lg mb-3"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mt-auto"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    ))}
  </div>
));

ProductGridSkeleton.displayName = 'ProductGridSkeleton';

// Empty state otimizado
const EmptyState = memo(() => (
  <div className="text-center py-16">
    <Package className="mx-auto mb-4 text-gray-400" size={80} />
    <h3 className="text-xl font-medium text-gray-900 mb-2">
      Nenhum produto encontrado
    </h3>
    <p className="text-gray-500 max-w-md mx-auto">
      Não há produtos que correspondem aos seus critérios de busca. 
      Tente ajustar os filtros ou termos de pesquisa.
    </p>
  </div>
));

EmptyState.displayName = 'EmptyState';

const ProductGrid = memo(({ products = [], loading = false, onRequestQuote, user }) => {
  // Memoização inteligente dos produtos
  const memoizedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(Boolean); // Remove produtos null/undefined
  }, [products]);

  // Callback memoizado para evitar re-renders nos cards
  const memoizedOnRequestQuote = useCallback((product) => {
    if (typeof onRequestQuote === 'function') {
      onRequestQuote(product);
    }
  }, [onRequestQuote]);

  // Renderização condicional otimizada
  const renderContent = useCallback(() => {
    if (loading) {
      return <ProductGridSkeleton />;
    }

    if (memoizedProducts.length === 0) {
      return <EmptyState />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {memoizedProducts.map(product => (
          <Suspense 
            key={product.id} 
            fallback={<LoadingSpinner size="sm" />}
          >
            <ProductCard 
              product={product} 
              onRequestQuote={memoizedOnRequestQuote} 
              user={user} 
            />
          </Suspense>
        ))}
      </div>
    );
  }, [loading, memoizedProducts, memoizedOnRequestQuote, user]);

  // Header memoizado
  const headerInfo = useMemo(() => {
    if (loading || memoizedProducts.length === 0) return null;
    
    const count = memoizedProducts.length;
    return {
      count,
      text: `Mostrando ${count} produto${count !== 1 ? 's' : ''}`
    };
  }, [loading, memoizedProducts.length]);

  return (
    <div className="w-full">
      {/* Header with product count */}
      {headerInfo && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {headerInfo.text}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Package size={14} />
            <span>Produtos industriais certificados</span>
          </div>
        </div>
      )}
      
      {renderContent()}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;