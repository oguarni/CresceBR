import React from 'react';
import { X, Building, Users, ShoppingCart } from 'lucide-react';
import { formatCNPJ } from '../../utils/validation';

const AuthModal = ({ 
  showAuth, 
  setShowAuth, 
  isLogin, 
  setIsLogin, 
  authForm, 
  setAuthForm, 
  handleAuth, 
  loading,
  validationErrors = {}
}) => {
  if (!showAuth) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuth();
  };

  const handleCNPJChange = (e) => {
    const formatted = formatCNPJ(e.target.value);
    setAuthForm({...authForm, cnpj: formatted});
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
    setAuthForm({...authForm, phone: formatted});
  };

  const getFieldError = (field) => validationErrors[field];
  const hasError = (field) => !!getFieldError(field);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 modal-backdrop">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 relative max-h-screen overflow-y-auto fade-in">
        <button 
          onClick={() => setShowAuth(false)} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <Building className="mx-auto mb-2 text-blue-600" size={48} />
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Acesso B2B' : 'Cadastro Empresarial'}
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            {isLogin ? 'Entre com suas credenciais' : 'Registre sua empresa no marketplace'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Nome do responsável */}
              <div>
                <input
                  type="text"
                  placeholder="Nome do responsável *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('name') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={authForm.name || ''}
                  onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                />
                {hasError('name') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('name')}</p>
                )}
              </div>

              {/* Razão Social */}
              <div>
                <input
                  type="text"
                  placeholder="Razão Social da Empresa *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('companyName') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={authForm.companyName || ''}
                  onChange={(e) => setAuthForm({...authForm, companyName: e.target.value})}
                />
                {hasError('companyName') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('companyName')}</p>
                )}
              </div>

              {/* CNPJ */}
              <div>
                <input
                  type="text"
                  placeholder="CNPJ *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('cnpj') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={authForm.cnpj || ''}
                  onChange={handleCNPJChange}
                  maxLength={18}
                />
                {hasError('cnpj') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('cnpj')}</p>
                )}
              </div>

              {/* Setor Industrial */}
              <div>
                <select
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('sector') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={authForm.sector || ''}
                  onChange={(e) => setAuthForm({...authForm, sector: e.target.value})}
                >
                  <option value="">Selecione o setor industrial *</option>
                  <option value="metalurgia">Metalurgia</option>
                  <option value="automotivo">Automotivo</option>
                  <option value="petrochemical">Petroquímico</option>
                  <option value="alimenticio">Alimentício</option>
                  <option value="textil">Têxtil</option>
                  <option value="construcao">Construção Civil</option>
                  <option value="eletroeletronico">Eletroeletrônico</option>
                  <option value="farmaceutico">Farmacêutico</option>
                  <option value="papel">Papel e Celulose</option>
                  <option value="outros">Outros</option>
                </select>
                {hasError('sector') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('sector')}</p>
                )}
              </div>

              {/* Tipo de Usuário */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tipo de empresa *</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    authForm.role === 'buyer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="buyer"
                      checked={authForm.role === 'buyer'}
                      onChange={(e) => setAuthForm({...authForm, role: e.target.value})}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <ShoppingCart className="mx-auto mb-2 text-blue-600" size={32} />
                      <div className="font-medium">Comprador</div>
                      <div className="text-xs text-gray-600">Busca produtos</div>
                    </div>
                  </label>

                  <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    authForm.role === 'supplier' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="supplier"
                      checked={authForm.role === 'supplier'}
                      onChange={(e) => setAuthForm({...authForm, role: e.target.value})}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <Users className="mx-auto mb-2 text-green-600" size={32} />
                      <div className="font-medium">Fornecedor</div>
                      <div className="text-xs text-gray-600">Vende produtos</div>
                    </div>
                  </label>
                </div>
                {hasError('role') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('role')}</p>
                )}
              </div>
            </>
          )}
          
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email empresarial *"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError('email') ? 'border-red-500' : 'border-gray-300'
              }`}
              value={authForm.email || ''}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            />
            {hasError('email') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('email')}</p>
            )}
          </div>
          
          {/* Senha */}
          <div>
            <input
              type="password"
              placeholder={isLogin ? "Senha" : "Senha (mín. 6 caracteres) *"}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasError('password') ? 'border-red-500' : 'border-gray-300'
              }`}
              value={authForm.password || ''}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            />
            {hasError('password') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('password')}</p>
            )}
          </div>
          
          {!isLogin && (
            <>
              {/* Telefone */}
              <div>
                <input
                  type="text"
                  placeholder="Telefone empresarial *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    hasError('phone') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={authForm.phone || ''}
                  onChange={handlePhoneChange}
                  maxLength={15}
                />
                {hasError('phone') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('phone')}</p>
                )}
              </div>

              {/* Endereço */}
              <div>
                <textarea
                  placeholder="Endereço completo da empresa *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    hasError('address') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows={3}
                  value={authForm.address || ''}
                  onChange={(e) => setAuthForm({...authForm, address: e.target.value})}
                />
                {hasError('address') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('address')}</p>
                )}
              </div>
            </>
          )}
          
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin inline-block w-5 h-5 border-b-2 border-white mr-2"></div>
                Processando...
              </div>
            ) : (
              isLogin ? 'Entrar' : 'Cadastrar Empresa'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 ml-1 hover:underline font-medium"
            >
              {isLogin ? 'Cadastre sua empresa' : 'Faça login'}
            </button>
          </p>
        </div>
        
        {isLogin && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              <strong>Conta demo:</strong><br />
              Admin: admin@b2bmarketplace.com / 123456<br />
              Comprador: buyer@empresa.com / 123456<br />
              Fornecedor: supplier@empresa.com / 123456
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;