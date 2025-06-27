import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Remove,
  Add,
  Delete,
  Send,
  ArrowBack,
} from '@mui/icons-material';
import { useQuotationRequest } from '../contexts/QuotationContext';
import { useAuth } from '../contexts/AuthContext';
import { quotationsService } from '../services/quotationsService';
import toast from 'react-hot-toast';

const QuotationRequestPage: React.FC = () => {
  const { items, totalItems, updateQuantity, removeItem, clearRequest } = useQuotationRequest();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleSubmitQuotationRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/quotation-request' } } });
      return;
    }

    if (user?.role !== 'customer') {
      toast.error('Apenas clientes podem solicitar cotações');
      return;
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item à solicitação de cotação');
      return;
    }

    setIsSubmitting(true);
    try {
      const quotationData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await quotationsService.createQuotation(quotationData);
      toast.success('Solicitação de cotação enviada com sucesso!');
      clearRequest();
      navigate('/my-quotations');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar solicitação de cotação';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Sua solicitação de cotação está vazia
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Adicione alguns produtos à sua solicitação de cotação para continuar
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/"
            startIcon={<ArrowBack />}
          >
            Navegar Produtos
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Solicitação de Cotação
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {totalItems} {totalItems === 1 ? 'item' : 'itens'} na sua solicitação
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Quotation Items */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  <Box sx={{ display: 'flex', py: 2, alignItems: 'center' }}>
                    <Avatar
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      variant="rounded"
                      sx={{ width: 80, height: 80, mr: 2 }}
                      imgProps={{
                        onError: (e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik00MCAyNEw1NiA0MEg0OFY1NkgzMlY0MEgyNEw0MCAyNFoiIGZpbGw9IiM5MDkwOTAiLz4KPHN2Zz4K';
                        }
                      }}
                    />
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {item.product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {item.product.description.length > 100
                          ? `${item.product.description.substring(0, 100)}...`
                          : item.product.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Categoria: {item.product.category}
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Preço de referência: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.product.price)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Remove />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 0;
                            handleQuantityChange(item.id, qty);
                          }}
                          sx={{ width: 80, mx: 1 }}
                          inputProps={{ min: 0, style: { textAlign: 'center' } }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Add />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.quantity} unidade{item.quantity !== 1 ? 's' : ''}
                      </Typography>
                      
                      <IconButton
                        color="error"
                        onClick={() => removeItem(item.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  {index < items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              component={Link}
              to="/"
              startIcon={<ArrowBack />}
            >
              Continuar Navegando
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={clearRequest}
              startIcon={<Delete />}
            >
              Limpar Solicitação
            </Button>
          </Box>
        </Grid>

        {/* Quotation Summary */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo da Solicitação
              </Typography>
              
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>Total de itens:</Typography>
                  <Typography fontWeight="medium">{totalItems}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  * Os preços mostrados são apenas de referência. O preço final será definido após a análise da sua solicitação de cotação.
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />

              {!isAuthenticated && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Faça login para enviar a solicitação de cotação
                </Alert>
              )}

              {isAuthenticated && user?.role !== 'customer' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Apenas clientes podem solicitar cotações
                </Alert>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                onClick={handleSubmitQuotationRequest}
                disabled={isSubmitting || !isAuthenticated || user?.role !== 'customer'}
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Cotação'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QuotationRequestPage;