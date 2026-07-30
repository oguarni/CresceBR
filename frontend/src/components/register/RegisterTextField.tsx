import React from 'react';
import { CircularProgress, InputAdornment, TextField } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import type { RegisterTextFieldName } from '../../utils/registerForm';

interface RegisterTextFieldProps {
  field: RegisterTextFieldName;
  label: string;
  value: string;
  onChange: (field: RegisterTextFieldName, value: string) => void;
  maxLength: number;
  /**
   * Passed as a component rather than an element: an inline `<Email />` would be
   * a fresh object on every parent render and defeat the memo comparison below.
   */
  icon?: SvgIconComponent;
  format?: (value: string) => string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  loading?: boolean;
}

/**
 * A single free-text field of the registration form, memoised so that typing in
 * one input does not re-render the other twenty-three.
 *
 * Every prop is either a primitive, a module-level function, or the stable
 * `setField` callback, so the default shallow comparison is enough — the field
 * re-renders only when its own value changes.
 *
 * @example
 * <RegisterTextField
 *   field='email'
 *   label={t('register.email')}
 *   value={formData.email}
 *   onChange={setField}
 *   maxLength={INPUT_LIMITS.email}
 *   icon={Email}
 *   required
 * />
 */
export const RegisterTextField: React.FC<RegisterTextFieldProps> = React.memo(
  ({
    field,
    label,
    value,
    onChange,
    maxLength,
    icon: Icon,
    format,
    placeholder,
    required,
    autoComplete,
    multiline,
    rows,
    loading,
  }) => (
    <TextField
      required={required}
      fullWidth
      id={field}
      name={field}
      label={label}
      value={value}
      autoComplete={autoComplete}
      multiline={multiline}
      rows={rows}
      placeholder={placeholder}
      onChange={e => onChange(field, format ? format(e.target.value) : e.target.value)}
      inputProps={{ maxLength }}
      InputProps={{
        startAdornment: Icon ? (
          <InputAdornment position='start'>
            <Icon />
          </InputAdornment>
        ) : undefined,
        endAdornment: loading ? (
          <InputAdornment position='end'>
            <CircularProgress size={20} />
          </InputAdornment>
        ) : undefined,
      }}
    />
  )
);

RegisterTextField.displayName = 'RegisterTextField';
