import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getProducts(filters);
      setProducts(data.products);
    } catch (error) {
      setError('Erro ao carregar produtos');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    try {
      setLoading(true);
      await apiService.createProduct(productData);
      return true;
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao criar produto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      setLoading(true);
      await apiService.updateProduct(id, productData);
      return true;
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao atualizar produto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await apiService.deleteProduct(id);
      await loadProducts();
      return true;
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao deletar produto');
      return false;
    }
  };

  const clearError = () => setError('');

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError
  };
};