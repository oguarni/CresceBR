// contexts/AppContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSecureAuth } from '../hooks/useSecureAuth';
import { useQuotes } from '../hooks/useQuotes';
import { useProducts } from '../hooks/useProducts';
import { useForm } from '../hooks/useForm';
import { apiService } from '../services/api';
import { UI_ACTIONS } from '../utils/constants';

// Estado inicial da UI
const initialUIState = {
  isMenuOpen: false,
  selectedCategory: 'Todas',
  searchTerm: '',
  showQuotes: false,
  showAuth: false,
  showQuoteModal: false,
  showAdmin: false,
  showQuoteSuccess: false,
  showQuoteComparison: false,
  showOrders: false,
  isLogin: true,
  notifications: []
};

// Reducer para UI
const uiReducer = (state, action) => {
  switch (action.type) {
    case UI_ACTIONS.TOGGLE_MODAL:
      return { ...state, [action.modal]: action.show };
    case UI_ACTIONS.SET_SEARCH:
      return { ...state, searchTerm: action.term };
    case UI_ACTIONS.SET_CATEGORY:
      return { ...state, selectedCategory: action.category };
    case UI_ACTIONS.TOGGLE_MENU:
      return { ...state, isMenuOpen: !state.isMenuOpen };
    case UI_ACTIONS.ADD_NOTIFICATION:
      return { 
        ...state, 
        notifications: [...state.notifications, { 
          id: Date.now(), 
          ...action.notification 
        }]
      };
    case UI_ACTIONS.REMOVE_NOTIFICATION:
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
    case UI_ACTIONS.RESET_UI:
      return initialUIState;
    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [uiState, dispatch] = useReducer(uiReducer, initialUIState);
  
  // Hooks de domínio
  const auth = useSecureAuth();
  const quotes = useQuotes();
  const products = useProducts();

  // Forms
  const authForm = useForm({ 
    email: '', 
    password: '', 
    name: '', 
    cnpj: '', 
    companyName: '', 
    role: '', 
    address: '', 
    phone: '',
    sector: ''
  });
  
  const quoteForm = useForm({ 
    quantity: 1,
    urgency: 'normal',
    deliveryAddress: '',
    specifications: '',
    message: ''
  });
  
  const productForm = useForm({ 
    name: '', 
    category: 'Maquinário', 
    price: '', 
    unit: 'unidade', 
    description: '', 
    image: '📦',
    minQuantity: 1
  });

  // Effects
  useEffect(() => {
    products.loadProducts();
    if (auth.user) {
      quotes.loadUserQuotes();
    }
  }, [auth.user]);

  useEffect(() => {
    const filters = {};
    if (uiState.selectedCategory !== 'Todas') filters.category = uiState.selectedCategory;
    if (uiState.searchTerm) filters.search = uiState.searchTerm;
    products.loadProducts(filters);
  }, [uiState.selectedCategory, uiState.searchTerm]);

  // Helper functions for UI
  const showModal = (modalName) => {
    updateUI({ [modalName]: true });
  };

  const hideModal = (modalName) => {
    updateUI({ [modalName]: false });
  };

  const toggleMenu = () => {
    updateUI({ isMenuOpen: !uiState.isMenuOpen });
  };

  const closeMenu = () => {
    updateUI({ isMenuOpen: false });
  };

  // Enhanced auth object with role checking
  const enhancedAuth = {
    ...auth,
    hasRole: (role) => auth.user?.role === role,
    isAdmin: () => auth.user?.role === 'admin',
    isSupplier: () => auth.user?.role === 'supplier',
    isBuyer: () => auth.user?.role === 'buyer',
    hasPermission: (permission) => {
      const rolePermissions = {
        admin: ['admin', 'buy', 'sell', 'manage_products', 'approve_suppliers'],
        buyer: ['buy'],
        supplier: ['sell', 'manage_products']
      };
      return rolePermissions[auth.user?.role]?.includes(permission) || false;
    }
  };

  const contextValue = {
    // State
    uiState,
    auth: enhancedAuth,
    quotes,
    products,
    
    // Forms
    authForm,
    quoteForm,
    productForm,
    
    // UI helpers
    showModal,
    hideModal,
    toggleMenu,
    closeMenu,
    
    // Business Actions
    handleAuth,
    seedData,
    clearAllErrors
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de AppProvider');
  }
  return context;
};