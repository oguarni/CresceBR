// contexts/UIContext.js
import React, { createContext, useContext, useReducer } from 'react';

const UIContext = createContext();

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
    case 'TOGGLE_MODAL':
      return { ...state, [action.modal]: action.show };
    case 'UPDATE_UI':
      return { ...state, ...action.updates };
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.term };
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.category };
    case 'TOGGLE_MENU':
      return { ...state, isMenuOpen: !state.isMenuOpen };
    case 'CLOSE_MENU':
      return { ...state, isMenuOpen: false };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, { ...action.notification, id: Date.now() }]
      };
    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
    case 'RESET_UI':
      return initialUIState;
    default:
      return state;
  }
};

export const UIProvider = ({ children }) => {
  const [uiState, dispatch] = useReducer(uiReducer, initialUIState);

  // UI Helper functions
  const updateUI = (updates) => {
    dispatch({ type: 'UPDATE_UI', updates });
  };

  const showModal = (modalName) => {
    dispatch({ type: 'TOGGLE_MODAL', modal: modalName, show: true });
  };

  const hideModal = (modalName) => {
    dispatch({ type: 'TOGGLE_MODAL', modal: modalName, show: false });
  };

  const toggleModal = (modalName) => {
    dispatch({ type: 'TOGGLE_MODAL', modal: modalName, show: !uiState[modalName] });
  };

  const toggleMenu = () => {
    dispatch({ type: 'TOGGLE_MENU' });
  };

  const closeMenu = () => {
    dispatch({ type: 'CLOSE_MENU' });
  };

  const setSearch = (term) => {
    dispatch({ type: 'SET_SEARCH', term });
  };

  const setCategory = (category) => {
    dispatch({ type: 'SET_CATEGORY', category });
  };

  // Notification system
  const addNotification = (notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', notification });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id || Date.now());
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  };

  const contextValue = {
    uiState,
    updateUI,
    showModal,
    hideModal,
    toggleModal,
    toggleMenu,
    closeMenu,
    setSearch,
    setCategory,
    addNotification,
    removeNotification
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI deve ser usado dentro de UIProvider');
  }
  return context;
};