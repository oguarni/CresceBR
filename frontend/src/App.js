import React from 'react';
import Header from './components/common/Header';
import MainContent from './components/layout/MainContent';
import ModalsContainer from './components/common/ModalsContainer';
import NotificationContainer from './components/common/NotificationContainer';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <MainContent />
          <ModalsContainer />
          <NotificationContainer />
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;