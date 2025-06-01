import React from 'react';
import { X } from 'lucide-react';

const AuthModal = ({ 
  showAuth, 
  setShowAuth, 
  isLogin, 
  setIsLogin, 
  authForm, 
  setAuthForm, 
  handleAuth, 
  loading 
}) => {
  if (!showAuth) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuth();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button 
          onClick={() => setShowAuth(false)} 
          className="absolute top-4 right-4"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          {isLogin ? 'Login' : 'Cadastro'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Nome completo"
              className="w-full mb-4 px-4 py-2 border rounded-lg"
              value={authForm.name}
              onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
              required={!isLogin}
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={authForm.email}
            onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Senha"
            className="w-full mb-4 px-4 py-2 border rounded-lg"
            value={authForm.password}
            onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            required
          />
          
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="CPF"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={authForm.cpf}
                onChange={(e) => setAuthForm({...authForm, cpf: e.target.value})}
                required={!isLogin}
              />
              <input
                type="text"
                placeholder="Endereço"
                className="w-full mb-4 px-4 py-2 border rounded-lg"
                value={authForm.address}
                onChange={(e) => setAuthForm({...authForm, address: e.target.value})}
                required={!isLogin}
              />
            </>
          )}
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        
        <p className="text-center mt-4 text-sm">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 ml-1 hover:underline"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
        
        <p className="text-xs text-gray-600 mt-4 text-center">
          Admin: admin@b2bmarketplace.com / 123456
        </p>
      </div>
    </div>
  );
};

export default AuthModal;