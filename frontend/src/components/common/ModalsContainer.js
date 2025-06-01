import React from 'react';
import AuthModal from '../auth/AuthModal';
import CartSidebar from '../cart/CartSidebar';
import CheckoutModal from '../cart/CheckoutModal';
import AdminPanel from '../admin/AdminPanel';

const ModalsContainer = ({ uiState, updateUI, auth, cart, products, orders }) => (
  <>
    <AuthModal 
      showAuth={uiState.showAuth}
      setShowAuth={(show) => updateUI({ showAuth: show })}
      isLogin={uiState.isLogin}
      setIsLogin={(login) => updateUI({ isLogin: login })}
      authForm={auth.form.form}
      setAuthForm={auth.form.updateField}
      handleAuth={auth.handleAuth}
      loading={auth.loading}
    />

    <CartSidebar 
      showCart={uiState.showCart}
      setShowCart={(show) => updateUI({ showCart: show })}
      cart={cart.cart}
      updateQuantity={cart.updateQuantity}
      removeFromCart={cart.removeFromCart}
      getTotalValue={cart.getTotalValue}
      user={auth.user}
      setShowCheckout={(show) => updateUI({ showCheckout: show })}
      setShowAuth={(show) => updateUI({ showAuth: show })}
    />

    <CheckoutModal 
      showCheckout={uiState.showCheckout}
      setShowCheckout={(show) => updateUI({ showCheckout: show })}
      checkoutForm={cart.form.form}
      setCheckoutForm={cart.form.updateField}
      getTotalValue={cart.getTotalValue}
      handleCheckout={cart.handleCheckout}
      loading={orders.loading}
    />

    <AdminPanel 
      showAdmin={uiState.showAdmin}
      setShowAdmin={(show) => updateUI({ showAdmin: show })}
      user={auth.user}
      productForm={products.form.form}
      setProductForm={products.form.updateField}
      editingProduct={products.editingProduct}
      setEditingProduct={products.setEditingProduct}
      handleProductSubmit={products.handleProductSubmit}
      products={products.products}
      editProduct={products.editProduct}
      deleteProduct={products.deleteProduct}
      loading={products.loading}
    />
  </>
);

export default ModalsContainer;