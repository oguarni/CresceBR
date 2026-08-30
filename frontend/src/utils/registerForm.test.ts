import { describe, expect, it } from 'vitest';
import type { Translate } from '../contexts/LanguageContext';
import {
  EMPTY_REGISTER_FORM,
  formatCnpj,
  formatCpf,
  toRegisterPayload,
  validateRegisterForm,
  type RegisterFormData,
} from './registerForm';

const translate = ((key: string) => key) as Translate;

const validForm = (): RegisterFormData => ({
  ...EMPTY_REGISTER_FORM,
  email: 'buyer@example.com',
  password: 'secret123',
  confirmPassword: 'secret123',
  cpf: '123.456.789-01',
  cep: '85501-000',
  address: 'Industrial Avenue, 100',
  companyName: 'Buyer Company',
  corporateName: 'Buyer Company Ltd',
  cnpj: '12.345.678/0001-90',
  industrySector: 'machinery',
});

describe('registerForm formatters', () => {
  it.each([
    ['12345678901', '123.456.789-01'],
    ['123.456.789-01', '123.456.789-01'],
    ['12345', '12345'],
  ])('should format CPF input %s as %s', (input, expected) => {
    expect(formatCpf(input)).toBe(expected);
  });

  it('should preserve an over-length CPF so validation can reject it', () => {
    expect(formatCpf('123456789012')).toBe('123456789012');
  });

  it.each([
    ['12345678000190', '12.345.678/0001-90'],
    ['12.345.678/0001-90', '12.345.678/0001-90'],
    ['12345', '12345'],
  ])('should format CNPJ input %s as %s', (input, expected) => {
    expect(formatCnpj(input)).toBe(expected);
  });

  it('should preserve an over-length CNPJ so validation can reject it', () => {
    expect(formatCnpj('123456780001900')).toBe('123456780001900');
  });
});

describe('validateRegisterForm', () => {
  const invalidCases: Array<{
    caseName: string;
    overrides: Partial<RegisterFormData>;
    expected: string;
  }> = [
    {
      caseName: 'passwords differ',
      overrides: { confirmPassword: 'different123' },
      expected: 'register.validation.passwordsDontMatch',
    },
    {
      caseName: 'password is too short',
      overrides: { password: '12345', confirmPassword: '12345' },
      expected: 'register.validation.passwordTooShort',
    },
    {
      caseName: 'CPF does not contain eleven digits',
      overrides: { cpf: '123' },
      expected: 'register.validation.cpfInvalid',
    },
    {
      caseName: 'CNPJ does not contain fourteen digits',
      overrides: { cnpj: '123' },
      expected: 'register.validation.cnpjInvalid',
    },
    {
      caseName: 'address contains only whitespace',
      overrides: { address: '   ' },
      expected: 'register.validation.addressRequired',
    },
    {
      caseName: 'company name contains only whitespace',
      overrides: { companyName: '   ' },
      expected: 'register.validation.companyNameRequired',
    },
    {
      caseName: 'corporate name contains only whitespace',
      overrides: { corporateName: '   ' },
      expected: 'register.validation.corporateNameRequired',
    },
    {
      caseName: 'industry sector contains only whitespace',
      overrides: { industrySector: '   ' },
      expected: 'register.validation.industrySectorRequired',
    },
  ];

  it.each(invalidCases)(
    'should return the first validation error when $caseName',
    ({ overrides, expected }) => {
      expect(validateRegisterForm(translate, { ...validForm(), ...overrides })).toBe(expected);
    }
  );

  it('should accept formatted CPF and CNPJ values when all required fields are valid', () => {
    expect(validateRegisterForm(translate, validForm())).toBeNull();
  });
});

describe('toRegisterPayload', () => {
  it('should remove client-only confirmation and CEP fields', () => {
    const payload = toRegisterPayload(validForm());

    expect(payload).not.toHaveProperty('confirmPassword');
    expect(payload).not.toHaveProperty('cep');
    expect(payload.email).toBe('buyer@example.com');
  });

  it('should normalize unselected optional dropdowns to undefined', () => {
    const payload = toRegisterPayload(validForm());

    expect(payload.companySize).toBeUndefined();
    expect(payload.annualRevenue).toBeUndefined();
  });

  it('should preserve selected optional dropdown values without mutating the form', () => {
    const form = {
      ...validForm(),
      companySize: 'medium' as const,
      annualRevenue: '2m_10m' as const,
    };

    const payload = toRegisterPayload(form);

    expect(payload.companySize).toBe('medium');
    expect(payload.annualRevenue).toBe('2m_10m');
    expect(form.companySize).toBe('medium');
    expect(form.annualRevenue).toBe('2m_10m');
  });
});
