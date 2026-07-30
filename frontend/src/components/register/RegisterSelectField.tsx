import React from 'react';
import {
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import { useT } from '../../contexts/LanguageContext';
import type { TranslationKey } from '../../locales';

/** An option's stable value paired with the key that renders its label. */
export interface RegisterSelectOption {
  value: string;
  labelKey: TranslationKey;
}

interface RegisterSelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly RegisterSelectOption[];
  onChange: (value: string) => void;
  /** Component, not element — see the note in RegisterTextField. */
  icon?: SvgIconComponent;
  required?: boolean;
  helperText?: string;
}

/**
 * A dropdown of the registration form, memoised on the same terms as the text
 * fields. `options` must be a module-level constant for the memo to hold.
 *
 * @example
 * <RegisterSelectField
 *   id='companyType'
 *   label={t('register.companyType.label')}
 *   value={formData.companyType}
 *   options={COMPANY_TYPE_OPTIONS}
 *   onChange={handleCompanyTypeChange}
 *   icon={Business}
 *   required
 * />
 */
export const RegisterSelectField: React.FC<RegisterSelectFieldProps> = React.memo(
  ({ id, label, value, options, onChange, icon: Icon, required, helperText }) => {
    const t = useT();

    return (
      <FormControl fullWidth required={required}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          value={value}
          label={label}
          onChange={e => onChange(e.target.value)}
          startAdornment={
            Icon ? (
              <InputAdornment position='start'>
                <Icon />
              </InputAdornment>
            ) : undefined
          }
        >
          {options.map(option => (
            <MenuItem value={option.value} key={option.value}>
              {t(option.labelKey)}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }
);

RegisterSelectField.displayName = 'RegisterSelectField';
