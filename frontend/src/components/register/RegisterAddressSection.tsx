import React, { useCallback } from 'react';
import { Grid } from '@mui/material';
import { Home } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import { INPUT_LIMITS } from '../../utils/inputLimits';
import type { RegisterFormData, RegisterTextFieldName } from '../../utils/registerForm';
import { RegisterTextField } from './RegisterTextField';

interface RegisterAddressSectionProps {
  formData: RegisterFormData;
  onFieldChange: (field: RegisterTextFieldName, value: string) => void;
  onCepChange: (value: string) => void;
  isLoadingCep: boolean;
}

/** Plain fields of this block, in render order, that need nothing but a label. */
const ADDRESS_FIELDS = [
  {
    field: 'street',
    labelKey: 'register.street',
    placeholderKey: 'register.streetPlaceholder',
    span: 8,
  },
  {
    field: 'number',
    labelKey: 'register.number',
    placeholderKey: 'register.numberPlaceholder',
    span: 4,
  },
  {
    field: 'complement',
    labelKey: 'register.complement',
    placeholderKey: 'register.complementPlaceholder',
    span: 6,
  },
  {
    field: 'neighborhood',
    labelKey: 'register.neighborhood',
    placeholderKey: 'register.neighborhoodPlaceholder',
    span: 6,
  },
  { field: 'city', labelKey: 'register.city', placeholderKey: 'register.cityPlaceholder', span: 6 },
  {
    field: 'state',
    labelKey: 'register.state',
    placeholderKey: 'register.statePlaceholder',
    span: 6,
  },
  {
    field: 'phone',
    labelKey: 'register.phone',
    placeholderKey: 'register.phonePlaceholder',
    span: 6,
  },
] as const;

/**
 * Postal code, full address and its individual parts. Entering a valid CEP
 * autofills the rest through the ViaCEP lookup owned by `useRegisterForm`.
 */
export const RegisterAddressSection: React.FC<RegisterAddressSectionProps> = ({
  formData,
  onFieldChange,
  onCepChange,
  isLoadingCep,
}) => {
  const t = useT();

  // Adapts the CEP lookup to the shared field signature while staying stable,
  // which is what keeps RegisterTextField's memo effective for this input.
  const handleCepFieldChange = useCallback(
    (_field: RegisterTextFieldName, value: string) => onCepChange(value),
    [onCepChange]
  );

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='cep'
          label={t('register.cep')}
          value={formData.cep}
          onChange={handleCepFieldChange}
          maxLength={INPUT_LIMITS.cep}
          icon={Home}
          placeholder='00000-000'
          loading={isLoadingCep}
          required
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <RegisterTextField
          field='address'
          label={t('register.addressFull')}
          value={formData.address}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.address}
          icon={Home}
          placeholder={t('register.addressPlaceholder')}
          multiline
          rows={2}
          required
        />
      </Grid>

      {ADDRESS_FIELDS.map(({ field, labelKey, placeholderKey, span }) => (
        <Grid size={{ xs: 12, sm: span }} key={field}>
          <RegisterTextField
            field={field}
            label={t(labelKey)}
            value={formData[field]}
            onChange={onFieldChange}
            maxLength={INPUT_LIMITS[field]}
            placeholder={t(placeholderKey)}
          />
        </Grid>
      ))}
    </>
  );
};
