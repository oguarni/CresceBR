import React, { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import type { RegisterTextFieldName } from '../../utils/registerForm';

interface RegisterPasswordFieldProps {
  field: Extract<RegisterTextFieldName, 'password' | 'confirmPassword'>;
  label: string;
  value: string;
  onChange: (field: RegisterTextFieldName, value: string) => void;
  maxLength: number;
  autoComplete?: string;
}

/**
 * Password input with its own show/hide toggle.
 *
 * The visibility flag is deliberately local: held on the page it would re-render
 * the entire form every time either eye icon was clicked.
 *
 * @example
 * <RegisterPasswordField
 *   field='password'
 *   label={t('register.password')}
 *   value={formData.password}
 *   onChange={setField}
 *   maxLength={INPUT_LIMITS.password}
 * />
 */
export const RegisterPasswordField: React.FC<RegisterPasswordFieldProps> = React.memo(
  ({ field, label, value, onChange, maxLength, autoComplete }) => {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        required
        fullWidth
        id={field}
        name={field}
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(field, e.target.value)}
        inputProps={{ maxLength }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Lock />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton onClick={() => setVisible(previous => !previous)} edge='end'>
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  }
);

RegisterPasswordField.displayName = 'RegisterPasswordField';
