import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { ViaCepError, viaCepService } from '../services/viaCepService';
import {
  EMPTY_REGISTER_FORM,
  toRegisterPayload,
  validateRegisterForm,
  type RegisterFormData,
} from '../utils/registerForm';

interface UseRegisterFormResult {
  formData: RegisterFormData;
  setField: <K extends keyof RegisterFormData>(field: K, value: RegisterFormData[K]) => void;
  error: string;
  isLoading: boolean;
  isLoadingCep: boolean;
  handleCepChange: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Owns the registration form's state, its CEP autofill and its submission.
 *
 * `setField` is referentially stable so the memoised field components can skip
 * re-rendering when a sibling field changes — without that, every keystroke
 * re-rendered all 24 inputs.
 *
 * @example
 * const { formData, setField, handleSubmit } = useRegisterForm();
 */
export const useRegisterForm = (): UseRegisterFormResult => {
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_REGISTER_FORM);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const { register } = useAuth();
  const t = useT();
  const navigate = useNavigate();

  const setField = useCallback(
    <K extends keyof RegisterFormData>(field: K, value: RegisterFormData[K]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCepChange = useCallback(
    async (value: string) => {
      const cep = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, cep: viaCepService.formatCep(cep) }));

      if (!viaCepService.isValidCep(cep)) return;

      setIsLoadingCep(true);
      try {
        const address = await viaCepService.getAddressByCep(cep);
        setFormData(prev => ({
          ...prev,
          address: `${address.logradouro}, ${address.bairro}, ${address.localidade} - ${address.uf}`,
          street: address.logradouro || '',
          neighborhood: address.bairro || '',
          city: address.localidade || '',
          state: address.uf || '',
          zipCode: viaCepService.formatCep(cep),
        }));
        toast.success(t('register.toast.cepSuccess'));
      } catch (err: unknown) {
        toast.error(
          err instanceof ViaCepError
            ? t(`register.cepErrors.${err.code}`)
            : t('register.toast.cepError')
        );
      } finally {
        setIsLoadingCep(false);
      }
    },
    [t]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      const validationError = validateRegisterForm(t, formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsLoading(true);
      try {
        await register(toRegisterPayload(formData));
        toast.success(t('register.toast.success'));
        navigate('/');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        toast.error(
          axiosErr.response?.data?.error || axiosErr.message || t('register.toast.error')
        );
      } finally {
        setIsLoading(false);
      }
    },
    [formData, navigate, register, t]
  );

  return { formData, setField, error, isLoading, isLoadingCep, handleCepChange, handleSubmit };
};
