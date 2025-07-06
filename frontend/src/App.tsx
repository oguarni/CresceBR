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
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <MyQuotationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='quote-comparison'
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <QuoteComparisonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='my-orders'
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
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
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='admin/quotations'
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminQuotationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='admin/analytics'
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    {/* Analytics page component would go here */}
                    <div>Analytics Dashboard (To be implemented)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path='admin/company-verification'
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    {/* Company verification page would go here */}
                    <div>Company Verification (To be implemented)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path='admin/settings'
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    {/* Settings page would go here */}
                    <div>System Settings (To be implemented)</div>
                  </ProtectedRoute>
                }
              />

              {/* Supplier routes */}
              <Route
                path='supplier/dashboard'
                element={
                  <ProtectedRoute allowedRoles={['supplier']}>
                    {/* Supplier dashboard would go here */}
                    <div>Supplier Dashboard (To be implemented)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path='supplier/products'
                element={
                  <ProtectedRoute allowedRoles={['supplier']} requireApproved>
                    {/* Supplier products page would go here */}
                    <div>Supplier Products Management (To be implemented)</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path='supplier/orders'
                element={
                  <ProtectedRoute allowedRoles={['supplier']} requireApproved>
                    {/* Supplier orders page would go here */}
                    <div>Supplier Orders Management (To be implemented)</div>
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
