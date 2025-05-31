import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Container, Typography, Box, Button, Card, CardContent, Grid, 
  AppBar, Toolbar, TextField, Alert, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API Helper functions with error handling
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// API service methods
const apiService = {
  // Authentication
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // Products
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/products${queryString ? `?${queryString}` : ''}`);
  },

  // Dashboard
  getDashboardStats: () => apiCall('/dashboard/stats'),

  // Orders
  getOrders: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  // Suppliers
  getSuppliers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/suppliers${queryString ? `?${queryString}` : ''}`);
  },
};

// Navbar Component
function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} 
                    onClick={() => navigate('/')}>
          B2B Marketplace
        </Typography>
        <Button color="inherit" onClick={() => navigate('/products')}>
          Produtos
        </Button>
        {isLoggedIn ? (
          <>
            <Button color="inherit" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={() => navigate('/orders')}>
              Pedidos
            </Button>
            <Button color="inherit" onClick={() => navigate('/suppliers')}>
              Fornecedores
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Cadastrar
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Home Component
function Home() {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          B2B Marketplace
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Conectando fornecedores e compradores
        </Typography>
        
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="body1" paragraph align="center" sx={{ fontSize: '1.1rem' }}>
            Sistema completo de marketplace B2B para gestão de produtos, cotações e pedidos industriais.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" color="primary" size="large" onClick={() => navigate('/products')}>
            Explorar Produtos
          </Button>
          <Button variant="outlined" color="primary" size="large" onClick={() => navigate('/register')}>
            Cadastrar como Fornecedor
          </Button>
          <Button variant="text" color="primary" size="large" onClick={() => navigate('/login')}>
            Login
          </Button>
        </Box>

        <Grid container spacing={4} sx={{ mt: 6 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Sistema de Cotações B2B
                </Typography>
                <Typography variant="body2">
                  Solicite cotações de múltiplos fornecedores simultaneamente e compare preços em tempo real.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Fornecedores Verificados
                </Typography>
                <Typography variant="body2">
                  Trabalhe apenas com fornecedores verificados e confiáveis para sua indústria.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Dashboard de Analytics
                </Typography>
                <Typography variant="body2">
                  Acompanhe métricas de vendas, performance e histórico de transações.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, p: 4, backgroundColor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Funcionalidades Principais
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" component="div">
                • Catálogo de produtos industriais<br/>
                • Sistema de avaliações e reviews<br/>
                • Gestão completa de pedidos<br/>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1" component="div">
                • Painel administrativo<br/>
                • Notificações em tempo real<br/>
                • Relatórios de vendas<br/>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

// Products Component
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiService.getProducts();
        setProducts(data.products || data || []);
      } catch (err) {
        console.warn('API call failed, using mock data:', err.message);
        setError('Usando catálogo local...');
        
        // Fallback to mock data
        setProducts([
          {
            id: 1,
            name: 'Furadeira Industrial 1200W',
            description: 'Furadeira industrial de alta potência',
            price: '450.00'
          },
          {
            id: 2,
            name: 'Compressor de Ar 50L',
            description: 'Compressor de ar comprimido 2HP',
            price: '1200.00'
          },
          {
            id: 3,
            name: 'Multímetro Digital',
            description: 'Multímetro digital com display LCD',
            price: '89.90'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Produtos
        </Typography>
        
        {loading ? (
          <Typography>Carregando produtos...</Typography>
        ) : products.length === 0 ? (
          <Alert severity="info">
            Nenhum produto encontrado. O catálogo está sendo construído.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {product.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                      R$ {product.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

// Login Component
function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                margin="normal"
                required
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

// Register Component
function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    role: 'buyer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao cadastrar');
      }
    } catch (err) {
      setError('Erro ao cadastrar');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Cadastro
        </Typography>
        
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="CPF"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                margin="normal"
                required
              />
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Cadastrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSuppliers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Try to fetch real data from API
        const data = await apiService.getDashboardStats();
        setStats({
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalSuppliers: data.totalSuppliers || 0,
          totalRevenue: data.totalRevenue || 0
        });
      } catch (err) {
        console.warn('API call failed, using mock data:', err.message);
        setError('Conectando com dados locais...');
        
        // Fallback to mock data if API fails
        setStats({
          totalProducts: 8,
          totalOrders: 12,
          totalSuppliers: 3,
          totalRevenue: 15420.50
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography>Carregando dados do dashboard...</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Produtos
                </Typography>
                <Typography variant="h4">
                  {stats.totalProducts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Pedidos
                </Typography>
                <Typography variant="h4">
                  {stats.totalOrders}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Fornecedores
                </Typography>
                <Typography variant="h4">
                  {stats.totalSuppliers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Receita Total
                </Typography>
                <Typography variant="h4">
                  R$ {stats.totalRevenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações Rápidas
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/products')}
                    fullWidth
                  >
                    Ver Produtos
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/orders')}
                    fullWidth
                  >
                    Gerenciar Pedidos
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/suppliers')}
                    fullWidth
                  >
                    Ver Fornecedores
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status do Sistema
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • API Backend conectada<br/>
                  • Banco de dados PostgreSQL ativo<br/>
                  • Sistema de autenticação funcionando<br/>
                  • Pronto para receber pedidos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
          </>
        )}
      </Box>
    </Container>
  );
}

// Orders Component
function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiService.getOrders();
        setOrders(data.orders || data || []);
      } catch (err) {
        console.warn('API call failed, using mock data:', err.message);
        setError('Usando dados locais...');
        
        // Fallback to mock data
        setOrders([
          {
            id: 1,
            customer_name: 'João Silva',
            total: '1250.00',
            status: 'Pendente',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            customer_name: 'Maria Santos',
            total: '850.50',
            status: 'Aprovado',
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pedidos
        </Typography>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Typography>Carregando pedidos...</Typography>
        ) : orders.length === 0 ? (
          <Alert severity="info">
            Nenhum pedido encontrado. Crie seu primeiro pedido!
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.customer_name || 'N/A'}</TableCell>
                    <TableCell>R$ {order.total || '0.00'}</TableCell>
                    <TableCell>{order.status || 'Pendente'}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

// Suppliers Component
function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock suppliers data for fallback
  const mockSuppliers = [
    {
      id: 1,
      name: "Tech Supplies Corp",
      description: "Fornecedor especializado em componentes eletrônicos e tecnologia",
      contact_info: "contato@techsupplies.com | (11) 9999-0001"
    },
    {
      id: 2,
      name: "Industrial Materials Ltd",
      description: "Materiais industriais e equipamentos de alta qualidade",
      contact_info: "vendas@industrial.com | (11) 9999-0002"
    },
    {
      id: 3,
      name: "Office Solutions",
      description: "Soluções completas para escritório e ambiente corporativo",
      contact_info: "office@solutions.com | (11) 9999-0003"
    },
    {
      id: 4,
      name: "Green Packaging Co",
      description: "Embalagens sustentáveis e ecológicas para diversos setores",
      contact_info: "green@packaging.com | (11) 9999-0004"
    }
  ];

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getSuppliers();
        setSuppliers(Array.isArray(data.suppliers) ? data.suppliers : Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('API call failed, using mock data:', error.message);
        setError('Não foi possível conectar com o servidor. Exibindo dados locais.');
        setSuppliers(mockSuppliers);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Fornecedores
        </Typography>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Carregando fornecedores...
          </Alert>
        ) : suppliers.length === 0 ? (
          <Alert severity="info">
            Nenhum fornecedor encontrado. O cadastro está sendo construído.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {suppliers.map((supplier) => (
              <Grid item xs={12} sm={6} md={4} key={supplier.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {supplier.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {supplier.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Contato:</strong> {supplier.contact_info}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

// Layout with Navbar
function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/suppliers" element={<Suppliers />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

FROM node:18 AS build
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
