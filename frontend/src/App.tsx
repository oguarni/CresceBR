import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { QuotationRequestProvider } from './contexts/QuotationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import QuotationRequestPage from './pages/QuotationRequestPage';
import MyQuotationsPage from './pages/MyQuotationsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminQuotationsPage from './pages/AdminQuotationsPage';
import QuotationDetailPage from './pages/QuotationDetailPage';
import QuoteComparisonPage from './pages/QuoteComparisonPage';
import MyOrdersPage from './pages/MyOrdersPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <QuotationRequestProvider>
          <Routes>
            {/* Public routes */}
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />

            {/* Protected routes with layout */}
            <Route path='/' element={<Layout />}>
              <Route index element={<HomePage />} />

              {/* Customer routes */}
              <Route path='cart' element={<CartPage />} />
              <Route path='quotation-request' element={<QuotationRequestPage />} />
              <Route
                path='my-quotations'
                element={
                  <ProtectedRoute>
                    <MyQuotationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='quote-comparison'
                element={
                  <ProtectedRoute>
                    <QuoteComparisonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='my-orders'
                element={
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='quotations/:id'
                element={
                  <ProtectedRoute>
                    <QuotationDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='checkout'
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path='admin/products'
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='admin/quotations'
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminQuotationsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </QuotationRequestProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
