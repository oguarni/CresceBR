export { 
  AppProvider, 
  useAppContext,
  useAuth,
  useUI, 
  useQuotesContext, 
  useProductsContext 
} from './AppProvider';

/*
BEFORE (múltiplos providers):
<AuthProvider>
  <UIProvider>
    <ProductsProvider>
      <QuotesProvider>
        <App />
      </QuotesProvider>
    </ProductsProvider>
  </UIProvider>
</AuthProvider>

AFTER (provider único):
<AppProvider>
  <App />
</AppProvider>

HOOKS DISPONÍVEIS:
- useAppContext()    // Hook principal com tudo
- useAuth()          // Apenas autenticação
- useUI()            // Apenas UI/modais/notificações  
- useQuotesContext() // Apenas cotações
- useProductsContext() // Apenas produtos

EXEMPLO DE USO EM COMPONENTES:
import { useAppContext } from '../contexts';
// ou
import { useAuth, useUI } from '../contexts';
*/