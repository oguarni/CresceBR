import { useState, useCallback } from 'react';
import { validateCNPJ, validateEmail } from '../utils/validation';

export const useValidation = () => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((field, value, rules = {}) => {
    let error = '';

    if (rules.required && (!value || value.toString().trim() === '')) {
      error = `${rules.label || field} é obrigatório`;
    } else if (value) {
      switch (rules.type) {
        case 'email':
          if (!validateEmail(value)) {
            error = 'Email inválido';
          }
          break;
        case 'cnpj':
          if (!validateCNPJ(value)) {
            error = 'CNPJ inválido';
          }
          break;
        case 'password':
          if (value.length < 6) {
            error = 'Senha deve ter pelo menos 6 caracteres';
          }
          break;
        case 'phone':
          if (value.replace(/\D/g, '').length < 10) {
            error = 'Telefone inválido';
          }
          break;
        case 'number':
          if (isNaN(value) || parseFloat(value) <= 0) {
            error = 'Valor deve ser um número positivo';
          }
          break;
        default:
          if (rules.minLength && value.length < rules.minLength) {
            error = `Mínimo ${rules.minLength} caracteres`;
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            error = `Máximo ${rules.maxLength} caracteres`;
          }
      }
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  }, []);

  const validateForm = useCallback((formData, validationRules) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = formData[field];
      
      if (!validateField(field, value, rules)) {
        isValid = false;
      }
    });

    return isValid;
  }, [validateField]);

  const setFieldTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const hasError = useCallback((field) => {
    return touched[field] && errors[field];
  }, [errors, touched]);

  return {
    errors,
    touched,
    validateField,
    validateForm,
    setFieldTouched,
    clearErrors,
    hasError,
    getError: (field) => errors[field]
  };
};