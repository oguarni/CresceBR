import React from 'react';
import AuthModal from '../auth/AuthModal';
import QuotesSidebar from '../quotes/QuotesSidebar';
import QuoteModal from '../quotes/QuoteModal';
import QuoteComparisonModal from '../quotes/QuoteComparisonModal';
import AdminPanel from '../admin/AdminPanel';

const ModalsContainer = ({ 
  uiState, 
  updateUI, 
  auth, 
  quotes, 
  products 
}) => {
  return (
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
        error={auth.error}
      />

      <QuotesSidebar 
        showQuotes={uiState.showQuotes}
        setShowQuotes={(show) => updateUI({ showQuotes: show })}
        quotes={quotes.quotes}
        loading={quotes.loading}
        user={auth.user}
        setShowQuoteComparison={(show) => updateUI({ showQuoteComparison: show })}
        setShowAuth={(show) => updateUI({ showAuth: show })}
      />

      <QuoteModal 
        show={uiState.showQuoteModal}
        onClose={() => updateUI({ showQuoteModal: false })}
        product={quotes.selectedProduct}
        user={auth.user}
        quoteForm={quotes.form.form}
        setQuoteForm={quotes.form.updateField}
        onSubmitQuote={quotes.handleSubmitQuote}
        loading={quotes.loading}
      />

      <QuoteComparisonModal 
        show={uiState.showQuoteComparison}
        onClose={() => updateUI({ showQuoteComparison: false })}
        quotes={quotes.getRespondedQuotes()}
        onAcceptQuote={quotes.updateQuoteStatus}
        loading={quotes.loading}
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
};

export default ModalsContainer;