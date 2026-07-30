import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from '@mui/material';
import {
  Business,
  Category,
  CheckCircle,
  Email,
  ExpandMore,
  LocationOn,
  Phone,
  Warning,
} from '@mui/icons-material';
import { useT } from '../contexts/LanguageContext';
import type { TranslationKey } from '../locales';
import { companyTypeLabel, sectorLabel, type Company } from '../utils/companyVerification';

interface CompanyDetailsDialogProps {
  open: boolean;
  company: Company | null;
  cnpjValidating: boolean;
  onClose: () => void;
  onValidateCnpj: (companyId: number) => void;
  onVerify: () => void;
}

interface DetailFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/** One label/value pair in a details accordion, optionally led by an icon. */
const DetailField: React.FC<DetailFieldProps> = ({ label, value, icon, fullWidth }) => {
  const body = (
    <Box>
      <Typography variant='subtitle2'>{label}</Typography>
      <Typography variant='body2'>{value}</Typography>
    </Box>
  );

  return (
    <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6 }}>
      {icon ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          {body}
        </Box>
      ) : (
        body
      )}
    </Grid>
  );
};

/** A collapsible details section; only the first is expanded on open. */
const DetailSection: React.FC<{
  titleKey: TranslationKey;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ titleKey, defaultExpanded, children }) => {
  const t = useT();

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant='h6'>{t(titleKey)}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

/**
 * Read-only company dossier the admin reviews before approving or rejecting,
 * with an inline CNPJ revalidation action when the document is still unverified.
 *
 * @example
 * <CompanyDetailsDialog
 *   open={detailsOpen}
 *   company={selectedCompany}
 *   cnpjValidating={cnpjValidating}
 *   onClose={closeDetails}
 *   onValidateCnpj={validateCnpj}
 *   onVerify={openVerificationDialog}
 * />
 */
export const CompanyDetailsDialog: React.FC<CompanyDetailsDialogProps> = ({
  open,
  company,
  cnpjValidating,
  onClose,
  onValidateCnpj,
  onVerify,
}) => {
  const t = useT();
  const orNotInformed = (value?: string) => value || t('companyVerification.notInformed');

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Business />
        {t('companyVerification.detailsTitle')}
      </DialogTitle>
      <DialogContent>
        {company && (
          <Box sx={{ mt: 1 }}>
            <DetailSection titleKey='companyVerification.sections.basicInfo' defaultExpanded>
              <Grid container spacing={2}>
                <DetailField
                  label={t('companyVerification.fields.tradeName')}
                  value={company.companyName}
                  icon={<Business color='primary' />}
                />
                <DetailField
                  label={t('companyVerification.fields.corporateName')}
                  value={company.corporateName}
                  icon={<Business color='primary' />}
                />
                <DetailField
                  label={t('companyVerification.fields.email')}
                  value={company.email}
                  icon={<Email color='primary' />}
                />
                <DetailField
                  label={t('companyVerification.fields.phone')}
                  value={orNotInformed(company.phone)}
                  icon={<Phone color='primary' />}
                />
              </Grid>
            </DetailSection>

            <DetailSection titleKey='companyVerification.sections.documentation'>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='subtitle2'>
                    {t('companyVerification.fields.responsibleCpf')}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 2 }}>
                    {company.cpf}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='subtitle2'>
                      {t('companyVerification.fields.cnpj')}
                    </Typography>
                    {company.cnpjValidated ? (
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                    )}
                  </Box>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    {company.cnpj}
                  </Typography>
                  {!company.cnpjValidated && (
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => onValidateCnpj(company.id)}
                      disabled={cnpjValidating}
                      startIcon={cnpjValidating ? <CircularProgress size={16} /> : <CheckCircle />}
                    >
                      {t('companyVerification.validateCnpj')}
                    </Button>
                  )}
                </Grid>
              </Grid>
            </DetailSection>

            <DetailSection titleKey='companyVerification.sections.address'>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn color='primary' />
                <Box>
                  <Typography variant='body2'>{company.address}</Typography>
                  {company.street && (
                    <Typography variant='caption' color='text.secondary'>
                      {company.street}, {company.number}
                      {company.city && ` - ${company.city}/${company.state}`}
                      {company.zipCode && ` - CEP: ${company.zipCode}`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </DetailSection>

            <DetailSection titleKey='companyVerification.sections.commercialInfo'>
              <Grid container spacing={2}>
                <DetailField
                  label={t('companyVerification.fields.sector')}
                  value={sectorLabel(t, company.industrySector)}
                  icon={<Category color='primary' />}
                />
                <DetailField
                  label={t('companyVerification.fields.companyType')}
                  value={companyTypeLabel(t, company.companyType)}
                />
                <DetailField
                  label={t('companyVerification.fields.companySize')}
                  value={orNotInformed(company.companySize)}
                />
                <DetailField
                  label={t('companyVerification.fields.revenue')}
                  value={orNotInformed(company.annualRevenue)}
                />
                <DetailField
                  label={t('companyVerification.fields.website')}
                  value={orNotInformed(company.website)}
                  fullWidth
                />
              </Grid>
            </DetailSection>

            <DetailSection titleKey='companyVerification.sections.contact'>
              <Grid container spacing={2}>
                <DetailField
                  label={t('companyVerification.fields.contactPerson')}
                  value={orNotInformed(company.contactPerson)}
                />
                <DetailField
                  label={t('companyVerification.fields.contactTitle')}
                  value={orNotInformed(company.contactTitle)}
                />
              </Grid>
            </DetailSection>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('companyVerification.close')}</Button>
        {company?.status === 'pending' && (
          <Button variant='contained' onClick={onVerify}>
            {t('companyVerification.verifyCompany')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
