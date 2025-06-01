import React, { createContext, useContext } from 'react';
import { useSecureAuth } from '../hooks/useSecureAuth';
import { useForm } from '../hooks/useForm';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const auth = useSecureAuth();
  
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
    },
    getUserDisplayInfo: () => {
      if (!auth.user) return null;
      return {
        name: auth.user.name,
        company: auth.user.companyName,
        roleLabel: auth.user.role === 'admin' ? 'Administrador' : 
                   auth.user.role === 'supplier' ? 'Fornecedor' : 'Comprador'
      };
    }
  };

  const handleAuth = async (isLogin) => {
    const success = isLogin 
      ? await auth.login(authForm.form.email, authForm.form.password)
      : await auth.register(authForm.form);
    
    if (success) {
      authForm.resetForm();
      return true;
    }
    return false;
  };

  const contextValue = {
    auth: enhancedAuth,
    authForm,
    handleAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};