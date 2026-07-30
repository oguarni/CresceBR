import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useT } from '../contexts/LanguageContext';
import type { Company } from '../utils/companyVerification';

interface CompanyVerificationDialogProps {
  open: boolean;
  company: Company | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onDecide: (status: 'approved' | 'rejected') => void;
}

/**
 * Approve/reject confirmation carrying an optional free-text reason, with a
 * warning when the company's CNPJ has not been validated yet.
 *
 * @example
 * <CompanyVerificationDialog
 *   open={verifying}
 *   company={selectedCompany}
 *   reason={reason}
 *   onReasonChange={setReason}
 *   onClose={closeDialog}
 *   onDecide={status => verifyCompany(company.id, status, reason)}
 * />
 */
export const CompanyVerificationDialog: React.FC<CompanyVerificationDialogProps> = ({
  open,
  company,
  reason,
  onReasonChange,
  onClose,
  onDecide,
}) => {
  const t = useT();

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        {t('companyVerification.verifyCompany')}: {company?.companyName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            {t('companyVerification.verifyPrompt')}
          </Typography>

          <TextField
            fullWidth
            label={t('companyVerification.reasonLabel')}
            multiline
            rows={3}
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onReasonChange(e.target.value)}
            placeholder={t('companyVerification.reasonPlaceholder')}
            sx={{ mb: 2 }}
          />

          {company && !company.cnpjValidated && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              <Typography variant='body2'>{t('companyVerification.unvalidatedWarning')}</Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('companyVerification.cancel')}</Button>
        <Button variant='outlined' color='error' onClick={() => onDecide('rejected')}>
          {t('companyVerification.reject')}
        </Button>
        <Button variant='contained' color='success' onClick={() => onDecide('approved')}>
          {t('companyVerification.approve')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
