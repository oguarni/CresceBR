/**
 * Shape, formatting and validation rules for the B2B registration form.
 *
 * Kept free of React so the rules can be unit-tested directly and so the field
 * formatters keep a stable module-level identity — passing them as props is what
 * lets the memoised field components skip re-rendering on unrelated keystrokes.
 */

import type { Translate } from '../contexts/LanguageContext';

export type CompanySize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise';

export type AnnualRevenue =
  | 'under_500k'
  | '500k_2m'
  | '2m_10m'
  | '10m_50m'
  | '50m_200m'
  | 'over_200m';

export type CompanyType = 'buyer' | 'supplier' | 'both';

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  cpf: string;
  cep: string;
  address: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  contactPerson: string;
  contactTitle: string;
  companySize: CompanySize | '';
  annualRevenue: AnnualRevenue | '';
  website: string;
  companyName: string;
  corporateName: string;
  cnpj: string;
  industrySector: string;
  companyType: CompanyType;
}

/** Free-text fields the generic text input can drive, i.e. everything but the selects. */
export type RegisterTextFieldName = Exclude<
  keyof RegisterFormData,
  'companySize' | 'annualRevenue' | 'companyType'
>;

export const EMPTY_REGISTER_FORM: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  cpf: '',
  cep: '',
  address: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  contactPerson: '',
  contactTitle: '',
  companySize: '',
  annualRevenue: '',
  website: '',
  companyName: '',
  corporateName: '',
  cnpj: '',
  industrySector: '',
  companyType: 'buyer',
};

const CPF_DIGITS = 11;
const CNPJ_DIGITS = 14;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Masks a CPF as 000.000.000-00 once all 11 digits are present.
 *
 * Over-length input is returned untouched rather than truncated, so a paste of
 * the wrong document still reaches validation and produces a real error message.
 *
 * @example
 * formatCpf('12345678900'); // '123.456.789-00'
 */
export const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > CPF_DIGITS) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/** @example formatCnpj('12345678000190'); // '12.345.678/0001-90' */
export const formatCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > CNPJ_DIGITS) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const countDigits = (value: string): number => value.replace(/\D/g, '').length;

/**
 * Returns the first validation failure as a translated message, or null when the
 * form may be submitted. Order matters: it is the order the fields appear in.
 *
 * @example
 * const error = validateRegisterForm(t, formData);
 * if (error) return setError(error);
 */
export const validateRegisterForm = (t: Translate, form: RegisterFormData): string | null => {
  if (form.password !== form.confirmPassword) return t('register.validation.passwordsDontMatch');
  if (form.password.length < MIN_PASSWORD_LENGTH) return t('register.validation.passwordTooShort');
  if (countDigits(form.cpf) !== CPF_DIGITS) return t('register.validation.cpfInvalid');
  if (countDigits(form.cnpj) !== CNPJ_DIGITS) return t('register.validation.cnpjInvalid');
  if (!form.address.trim()) return t('register.validation.addressRequired');
  if (!form.companyName.trim()) return t('register.validation.companyNameRequired');
  if (!form.corporateName.trim()) return t('register.validation.corporateNameRequired');
  if (!form.industrySector.trim()) return t('register.validation.industrySectorRequired');
  return null;
};

/**
 * Strips the fields the API does not accept (confirmPassword, cep) and turns the
 * unselected-dropdown empty strings into undefined so they are omitted entirely.
 */
export const toRegisterPayload = (form: RegisterFormData) => {
  const { confirmPassword: _confirmPassword, cep: _cep, ...rest } = form;
  return {
    ...rest,
    companySize: form.companySize || undefined,
    annualRevenue: form.annualRevenue || undefined,
  };
};
