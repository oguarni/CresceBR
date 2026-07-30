import React from 'react';
import { Grid } from '@mui/material';
import { Business, Category } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import { INPUT_LIMITS } from '../../utils/inputLimits';
import {
  formatCnpj,
  type AnnualRevenue,
  type CompanySize,
  type CompanyType,
  type RegisterFormData,
  type RegisterTextFieldName,
} from '../../utils/registerForm';
import { RegisterTextField } from './RegisterTextField';
import { RegisterSelectField, type RegisterSelectOption } from './RegisterSelectField';

interface RegisterCompanySectionProps {
  formData: RegisterFormData;
  onFieldChange: (field: RegisterTextFieldName, value: string) => void;
  onCompanySizeChange: (value: string) => void;
  onAnnualRevenueChange: (value: string) => void;
  onIndustrySectorChange: (value: string) => void;
  onCompanyTypeChange: (value: string) => void;
}

// Module-level so the arrays keep a stable identity across renders — a fresh
// array literal each render would defeat RegisterSelectField's memo.
const COMPANY_SIZE_OPTIONS: readonly RegisterSelectOption[] = (
  ['micro', 'small', 'medium', 'large', 'enterprise'] satisfies CompanySize[]
).map(value => ({ value, labelKey: `register.companySize.${value}` }));

const ANNUAL_REVENUE_OPTIONS: readonly RegisterSelectOption[] = (
  ['under_500k', '500k_2m', '2m_10m', '10m_50m', '50m_200m', 'over_200m'] satisfies AnnualRevenue[]
).map(value => ({ value, labelKey: `register.annualRevenue.${value}` }));

const INDUSTRY_SECTOR_OPTIONS: readonly RegisterSelectOption[] = (
  [
    'machinery',
    'raw_materials',
    'components',
    'electronics',
    'textiles',
    'chemicals',
    'automotive',
    'food_beverage',
    'construction',
    'pharmaceutical',
    'other',
  ] as const
).map(value => ({ value, labelKey: `register.industry.${value}` }));

const COMPANY_TYPE_OPTIONS: readonly RegisterSelectOption[] = (
  ['buyer', 'supplier', 'both'] satisfies CompanyType[]
).map(value => ({ value, labelKey: `register.companyType.${value}` }));

/** Company identity, contact and classification — the closing block of the form. */
export const RegisterCompanySection: React.FC<RegisterCompanySectionProps> = ({
  formData,
  onFieldChange,
  onCompanySizeChange,
  onAnnualRevenueChange,
  onIndustrySectorChange,
  onCompanyTypeChange,
}) => {
  const t = useT();

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='website'
          label={t('register.website')}
          value={formData.website}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.website}
          placeholder={t('register.websitePlaceholder')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='companyName'
          label={t('register.companyName')}
          value={formData.companyName}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.companyName}
          icon={Business}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='corporateName'
          label={t('register.corporateName')}
          value={formData.corporateName}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.corporateName}
          icon={Business}
          required
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='cnpj'
          label={t('register.cnpj')}
          value={formData.cnpj}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.cnpj}
          icon={Business}
          format={formatCnpj}
          placeholder='00.000.000/0000-00'
          required
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='contactPerson'
          label={t('register.contactPerson')}
          value={formData.contactPerson}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.contactPerson}
          placeholder={t('register.contactPersonPlaceholder')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterTextField
          field='contactTitle'
          label={t('register.contactTitle')}
          value={formData.contactTitle}
          onChange={onFieldChange}
          maxLength={INPUT_LIMITS.contactTitle}
          placeholder={t('register.contactTitlePlaceholder')}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterSelectField
          id='companySize'
          label={t('register.companySize.label')}
          value={formData.companySize}
          options={COMPANY_SIZE_OPTIONS}
          onChange={onCompanySizeChange}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterSelectField
          id='annualRevenue'
          label={t('register.annualRevenue.label')}
          value={formData.annualRevenue}
          options={ANNUAL_REVENUE_OPTIONS}
          onChange={onAnnualRevenueChange}
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <RegisterSelectField
          id='industrySector'
          label={t('register.industry.label')}
          value={formData.industrySector}
          options={INDUSTRY_SECTOR_OPTIONS}
          onChange={onIndustrySectorChange}
          icon={Category}
          required
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <RegisterSelectField
          id='companyType'
          label={t('register.companyType.label')}
          value={formData.companyType}
          options={COMPANY_TYPE_OPTIONS}
          onChange={onCompanyTypeChange}
          icon={Business}
          required
          helperText={t('register.companyType.help')}
        />
      </Grid>
    </>
  );
};
