import React from 'react';
import { AlertTriangle, X, Info, CheckCircle } from 'lucide-react';

const ErrorHandler = ({ error, type = 'error', onClear, className = '' }) => {
  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'info': return <Info size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  const getStyles = () => {
    const baseStyles = "px-4 py-3 rounded-lg flex items-center justify-between shadow-md border-l-4";
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 text-green-800 border-green-400`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-800 border-yellow-400`;
      case 'info':
        return `${baseStyles} bg-blue-50 text-blue-800 border-blue-400`;
      default:
        return `${baseStyles} bg-red-50 text-red-800 border-red-400`;
    }
  };

  return (
    <div className={`${getStyles()} ${className}`}>
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className="text-sm font-medium">{error}</span>
      </div>
      {onClear && (
        <button 
          onClick={onClear}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorHandler;