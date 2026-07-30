import React from 'react';
import { Grid } from '@mui/material';
import { Email, Person } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import { INPUT_LIMITS } from '../../utils/inputLimits';
import {
  formatCpf,
  type RegisterFormData,
  type RegisterTextFieldName,
} from '../../utils/registerForm';
import { RegisterTextField } from './RegisterTextField';
import { RegisterPasswordField } from './RegisterPasswordField';

interface RegisterAccountSectionProps {
  formData: RegisterFormData;
  onFieldChange: (field: RegisterTextFieldName, value: string) => void;
}

/** Credentials and the representative's CPF — the first block of the form. */
export const RegisterAccountSection: React.FC<RegisterAccountSectionProps> = ({
  formData,
  onFieldChange,
}) => {
  const t = useT();

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <RegisterTextField
          field='email'
          label={t('register.email')}
          value={formData.email}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.email}
          icon={Email}
          autoComplete='email'
          required
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterPasswordField
          field='password'
          label={t('register.password')}
          value={formData.password}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.password}
          autoComplete='new-password'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterPasswordField
          field='confirmPassword'
          label={t('register.confirmPassword')}
          value={formData.confirmPassword}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.password}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='cpf'
          label={t('register.cpf')}
          value={formData.cpf}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.cpf}
          icon={Person}
          format={formatCpf}
          placeholder='000.000.000-00'
          required
        />
      </Grid>
    </>
  );
};
