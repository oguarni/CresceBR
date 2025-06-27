import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthResponse } from '@shared/types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, cpf: string, address: string) => Promise<void>;
  logout: () => void;
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem('crescebr_token');
  let user = null;
  let isAuthenticated = false;

  if (token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem('crescebr_token');
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        };
      }
      
      user = {
        id: payload.id,
        email: payload.email,
        cpf: '',
        address: '',
        role: payload.role,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      isAuthenticated = true;
    } catch (error) {
      localStorage.removeItem('crescebr_token');
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading: false,
  };
};

const initialState: AuthState = getInitialState();

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Only needed for token validation on app start if not already initialized
  useEffect(() => {
    if (state.isLoading) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.isLoading]);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('crescebr_token', response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const register = async (email: string, password: string, cpf: string, address: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.register(email, password, cpf, address);
      localStorage.setItem('crescebr_token', response.token);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('crescebr_token');
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};