import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Rating,
} from '@mui/material';
import { Search, Add, RequestQuote, AdminPanelSettings } from '@mui/icons-material';
import { Product } from '@shared/types';
import { productsService } from '../services/productsService';
import { useCart } from '../contexts/CartContext';
import { useQuotationRequest } from '../contexts/QuotationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { addItem } = useCart();
  const { addItem: addToQuotationRequest } = useQuotationRequest();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await productsService.getAllProducts({
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        page,
        limit: 12,
      });
      
      setProducts(response.products);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, page]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await productsService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated || user?.role === 'customer') {
      addToQuotationRequest(product);
    } else {
      addItem(product);
    }
  };

  const handleQuotationRequest = (product: Product) => {
    addToQuotationRequest(product);
  };

  const getButtonText = () => {
    if (!isAuthenticated || user?.role === 'customer') {
      return 'Adicionar à Cotação';
    }
    return 'Adicionar ao Carrinho';
  };

  const getButtonIcon = () => {
    if (!isAuthenticated || user?.role === 'customer') {
      return <RequestQuote />;
    }
    return <Add />;
  };

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // If user is admin, show admin-specific content
  if (isAuthenticated && user?.role === 'admin') {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AdminPanelSettings sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Painel Administrativo
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Bem-vindo ao sistema de administração do Marketplace B2B
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/admin/products')}
              >
                Gerenciar Produtos
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/admin/quotations')}
              >
                Gerenciar Cotações
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const generateRandomRating = () => {
    // Generate random rating between 3.5 and 5.0 for demo purposes
    return Math.round((Math.random() * 1.5 + 3.5) * 2) / 2;
  };

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Marketplace B2B
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {isAuthenticated && user?.role === 'customer' 
            ? 'Solicite cotações personalizadas para sua empresa'
            : 'Soluções para pequenas e médias empresas do sudoeste do Paraná'
          }
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                value={selectedCategory}
                label="Categoria"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">Todas as categorias</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setPage(1);
              }}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : products.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            Nenhum produto encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tente ajustar os filtros de busca
          </Typography>
        </Box>
      ) : (
        <>
          {/* Products Grid */}
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card 
                  className="card-hover"
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.imageUrl}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDEwMEgxMjBWMTQwSDgwVjEwMEg2MEwxMDAgNjBaIiBmaWxsPSIjOTA5MDkwIi8+CjwvdHZnPgo=';
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Chip 
                        label={product.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom noWrap>
                      {product.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {product.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={generateRandomRating()} precision={0.5} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({Math.floor(Math.random() * 50) + 10})
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatPrice(product.price)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={getButtonIcon()}
                      onClick={() => handleAddToCart(product)}
                    >
                      {getButtonText()}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default HomePage;