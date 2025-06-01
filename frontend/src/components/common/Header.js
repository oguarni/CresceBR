import React from 'react';
import { FileText, User, Menu, X, Package, Settings, Building } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const Header = () => {
  const { 
    uiState, 
    updateUI,
    auth, 
    quotes,
    seedData 
  } = useAppContext();

  const showModal = (modalName) => {
    updateUI({ [modalName]: true });
  };

  const toggleMenu = () => {
    updateUI({ isMenuOpen: !uiState.isMenuOpen });
  };

  const closeMenu = () => {
    updateUI({ isMenuOpen: false });
  };

  return (
    <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e Menu Mobile */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleMenu}
              className="md:hidden focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded p-1 transition-colors hover:bg-blue-700"
              aria-label={uiState.isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={uiState.isMenuOpen}
            >
              {uiState.isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center space-x-2">
              <Building size={28} aria-hidden="true" />
              <div>
                <h1 className="text-xl font-bold">
                  <span className="sr-only">B2B Marketplace - Soluções Industriais</span>
                  B2B Marketplace
                </h1>
                <p className="text-xs text-blue-200 hidden lg:block">Soluções Industriais</p>
              </div>
            </div>
          </div>
          
          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Menu principal">
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={seedData}
                className="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1 transition-colors text-sm"
                aria-label="Popular banco de dados com dados de exemplo"
                title="Adicionar dados de exemplo ao sistema"
              >
                Popular DB
              </button>
            )}
            
            {auth.user?.role === 'admin' && (
              <button 
                onClick={() => showModal('showAdmin')}
                className="hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-2 py-1 transition-colors flex items-center space-x-1"
                aria-label="Abrir painel administrativo"
                title="Gerenciar produtos e fornecedores"
              >
                <Settings size={16} aria-hidden="true" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Ações do usuário */}
          <div className="flex items-center space-x-4">
            {/* Botão Cotações */}
            <button 
              onClick={() => showModal('showQuotes')}
              className="relative bg-blue-700 px-3 py-2 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors flex items-center space-x-2"
              aria-label={`Ver cotações. ${quotes.getTotalQuotes()} cotações disponíveis`}
              title="Visualizar suas cotações"
            >
              <FileText size={18} aria-hidden="true" />
              <span className="hidden sm:inline text-sm">Cotações</span>
              {quotes.getTotalQuotes() > 0 && (
                <span 
                  className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium"
                  aria-label={`${quotes.getTotalQuotes()} cotações pendentes`}
                  role="status"
                >
                  {quotes.getTotalQuotes()}
                </span>
              )}
            </button>

            {/* Botão Pedidos - apenas para usuários logados */}
            {auth.user && (
              <button 
                onClick={() => showModal('showOrders')}
                className="bg-blue-700 px-3 py-2 rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors flex items-center space-x-2"
                aria-label="Ver seus pedidos"
                title="Visualizar histórico de pedidos"
              >
                <Package size={18} aria-hidden="true" />
                <span className="hidden sm:inline text-sm">Pedidos</span>
              </button>
            )}

            {/* Área do usuário */}
            {auth.user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium" aria-label={`Usuário logado: ${auth.user.name}`}>
                    {auth.user.name}
                  </div>
                  <div className="text-xs text-blue-200">
                    {auth.user.role === 'admin' ? 'Administrador' : 
                     auth.user.role === 'supplier' ? 'Fornecedor' : 'Comprador'}
                  </div>
                </div>
                <button 
                  onClick={auth.logout}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  aria-label="Fazer logout"
                  title="Sair do sistema"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => showModal('showAuth')}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
                aria-label="Fazer login ou cadastro"
                title="Entrar no sistema"
              >
                <User size={18} aria-hidden="true" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {uiState.isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-500" role="navigation" aria-label="Menu mobile">
            <div className="space-y-3 pt-4">
              {auth.user ? (
                <>
                  <div className="px-3 py-2 border-b border-blue-500 pb-3">
                    <div className="text-sm font-medium">{auth.user.name}</div>
                    <div className="text-xs text-blue-200">{auth.user.companyName || 'Empresa'}</div>
                    <div className="text-xs text-blue-300">
                      {auth.user.role === 'admin' ? 'Administrador' : 
                       auth.user.role === 'supplier' ? 'Fornecedor' : 'Comprador'}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      showModal('showQuotes');
                      closeMenu();
                    }}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label={`Ver cotações - ${quotes.getTotalQuotes()} disponíveis`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText size={18} aria-hidden="true" />
                      <span>Cotações</span>
                    </div>
                    {quotes.getTotalQuotes() > 0 && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {quotes.getTotalQuotes()}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      showModal('showOrders');
                      closeMenu();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    aria-label="Ver pedidos"
                  >
                    <Package size={18} aria-hidden="true" />
                    <span>Pedidos</span>
                  </button>

                  {auth.user.role === 'admin' && (
                    <button
                      onClick={() => {
                        showModal('showAdmin');
                        closeMenu();
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      aria-label="Abrir painel administrativo"
                    >
                      <Settings size={18} aria-hidden="true" />
                      <span>Painel Admin</span>
                    </button>
                  )}

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => {
                        seedData();
                        closeMenu();
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      aria-label="Popular banco de dados"
                    >
                      <span>🌱 Popular DB</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      auth.logout();
                      closeMenu();
                    }}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors mt-4 border-t border-blue-500 pt-4"
                    aria-label="Fazer logout"
                  >
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    showModal('showAuth');
                    closeMenu();
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  aria-label="Fazer login ou cadastro"
                >
                  <User size={18} aria-hidden="true" />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;