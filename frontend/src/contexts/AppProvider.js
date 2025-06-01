// contexts/AppProvider.js
import React from 'react';
import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';
import { QuotesProvider } from './QuotesContext';
import { ProductsProvider } from './ProductsContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const AppProvider = ({ children }) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UIProvider>
          <ProductsProvider>
            <QuotesProvider>
              {children}
            </QuotesProvider>
          </ProductsProvider>
        </UIProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};