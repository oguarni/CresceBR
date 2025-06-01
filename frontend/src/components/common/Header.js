import React from 'react';
import { FileText, User, Menu, X } from 'lucide-react';

const Header = ({ 
  user, 
  quotes,
  getTotalQuotes, 
  setShowQuotes, 
  setShowAuth, 
  setShowAdmin, 
  handleLogout, 
  seedData, 
  isMenuOpen, 
  setIsMenuOpen 
}) => {
  return (
    <header className="bg-blue-600 text-white sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold">B2B Marketplace</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button onClick={seedData} className="hover:text-blue-200">
              Popular DB
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => setShowAdmin(true)} className="hover:text-blue-200">
                Admin
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowQuotes(true)}
              className="relative bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <FileText size={20} />
              <span className="hidden sm:inline">Cotações</span>
              {quotes.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">
                  {getTotalQuotes()}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden sm:inline text-sm">{user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <User size={20} className="inline mr-2" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;