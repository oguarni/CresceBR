import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  navigate: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  translate: vi.fn((key: string) => key),
  formatCep: vi.fn(),
  isValidCep: vi.fn(),
  getAddressByCep: vi.fn(),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ register: mocks.register }),
}));

vi.mock('../../contexts/LanguageContext', () => ({
  useT: () => mocks.translate,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('../../services/viaCepService', () => {
  class ViaCepError extends Error {
    constructor(public readonly code: string) {
      super(`ViaCEP lookup failed: ${code}`);
      this.name = 'ViaCepError';
    }
  }

  return {
    ViaCepError,
    viaCepService: {
      formatCep: mocks.formatCep,
      isValidCep: mocks.isValidCep,
      getAddressByCep: mocks.getAddressByCep,
    },
  };
});

import { ViaCepError } from '../../services/viaCepService';
import { useRegisterForm } from '../useRegisterForm';

const createSubmitEvent = (): FormEvent =>
  ({
    preventDefault: vi.fn(),
  }) as unknown as FormEvent;

const setValidFields = (setField: ReturnType<typeof useRegisterForm>['setField']): void => {
  setField('email', 'buyer@example.com');
  setField('password', 'secret123');
  setField('confirmPassword', 'secret123');
  setField('cpf', '12345678901');
  setField('cep', '85501-000');
  setField('address', 'Industrial Avenue, 100');
  setField('companyName', 'Buyer Company');
  setField('corporateName', 'Buyer Company Ltd');
  setField('cnpj', '12345678000190');
  setField('industrySector', 'machinery');
};

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.formatCep.mockImplementation((cep: string) =>
      cep.length === 8 ? cep.replace(/(\d{5})(\d{3})/, '$1-$2') : cep
    );
    mocks.isValidCep.mockImplementation((cep: string) => /^\d{8}$/.test(cep));
  });

  it('should expose the empty form and stable field setter initially', () => {
    const { result, rerender } = renderHook(() => useRegisterForm());
    const initialSetField = result.current.setField;

    act(() => {
      result.current.setField('companyName', 'Buyer Company');
    });
    rerender();

    expect(result.current.formData.companyName).toBe('Buyer Company');
    expect(result.current.setField).toBe(initialSetField);
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoadingCep).toBe(false);
  });

  it('should format an incomplete CEP without starting a lookup', async () => {
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleCepChange('85501-12x');
    });

    expect(result.current.formData.cep).toBe('8550112');
    expect(mocks.formatCep).toHaveBeenCalledWith('8550112');
    expect(mocks.getAddressByCep).not.toHaveBeenCalled();
    expect(result.current.isLoadingCep).toBe(false);
  });

  it('should populate the address and notify the user after a successful CEP lookup', async () => {
    mocks.getAddressByCep.mockResolvedValue({
      cep: '85501-000',
      logradouro: 'Industrial Avenue',
      complemento: '',
      bairro: 'Industrial District',
      localidade: 'Pato Branco',
      uf: 'PR',
      ibge: '4118501',
      gia: '',
      ddd: '46',
      siafi: '7897',
    });
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleCepChange('85501-000');
    });

    expect(mocks.getAddressByCep).toHaveBeenCalledWith('85501000');
    expect(result.current.formData).toEqual(
      expect.objectContaining({
        cep: '85501-000',
        address: 'Industrial Avenue, Industrial District, Pato Branco - PR',
        street: 'Industrial Avenue',
        neighborhood: 'Industrial District',
        city: 'Pato Branco',
        state: 'PR',
        zipCode: '85501-000',
      })
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('register.toast.cepSuccess');
    expect(result.current.isLoadingCep).toBe(false);
  });

  it.each([
    {
      caseName: 'ViaCEP returns a coded error',
      error: new ViaCepError('NOT_FOUND'),
      expected: 'register.cepErrors.NOT_FOUND',
    },
    {
      caseName: 'an unexpected lookup error occurs',
      error: new Error('Connection closed'),
      expected: 'register.toast.cepError',
    },
  ])('should show the correct message when $caseName', async ({ error, expected }) => {
    mocks.getAddressByCep.mockRejectedValue(error);
    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      await result.current.handleCepChange('85501-000');
    });

    expect(mocks.toastError).toHaveBeenCalledWith(expected);
    expect(result.current.isLoadingCep).toBe(false);
  });

  it('should stop before registration when client-side validation fails', async () => {
    const { result } = renderHook(() => useRegisterForm());
    const event = createSubmitEvent();

    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe('register.validation.passwordTooShort');
    expect(mocks.register).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should submit the API payload, notify the user, and navigate home', async () => {
    mocks.register.mockResolvedValue(undefined);
    const { result } = renderHook(() => useRegisterForm());
    act(() => setValidFields(result.current.setField));

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(mocks.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.com',
        password: 'secret123',
        cpf: '12345678901',
        address: 'Industrial Avenue, 100',
        companyName: 'Buyer Company',
        corporateName: 'Buyer Company Ltd',
        cnpj: '12345678000190',
        industrySector: 'machinery',
        companyType: 'buyer',
      })
    );
    const payload = mocks.register.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('confirmPassword');
    expect(payload).not.toHaveProperty('cep');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('register.toast.success');
    expect(mocks.navigate).toHaveBeenCalledWith('/');
    expect(result.current.error).toBe('');
    expect(result.current.isLoading).toBe(false);
  });

  it.each([
    {
      caseName: 'the API provides a response error',
      error: {
        response: { data: { error: 'CNPJ already registered' } },
        message: 'Request failed',
      },
      expected: 'CNPJ already registered',
    },
    {
      caseName: 'the request provides only a message',
      error: new Error('Network unavailable'),
      expected: 'Network unavailable',
    },
    {
      caseName: 'the rejection has no useful details',
      error: {},
      expected: 'register.toast.error',
    },
  ])('should report registration failure when $caseName', async ({ error, expected }) => {
    mocks.register.mockRejectedValue(error);
    const { result } = renderHook(() => useRegisterForm());
    act(() => setValidFields(result.current.setField));

    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });

    expect(mocks.toastError).toHaveBeenCalledWith(expected);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('should expose loading state while registration is pending', async () => {
    let resolveRegistration!: () => void;
    mocks.register.mockReturnValue(
      new Promise<void>(resolve => {
        resolveRegistration = resolve;
      })
    );
    const { result } = renderHook(() => useRegisterForm());
    act(() => setValidFields(result.current.setField));

    let submission!: Promise<void>;
    act(() => {
      submission = result.current.handleSubmit(createSubmitEvent());
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveRegistration();
      await submission;
    });

    expect(result.current.isLoading).toBe(false);
  });
});
