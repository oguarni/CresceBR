import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack, Construction } from '@mui/icons-material';
import { useT } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BrazilFlag from '../components/BrazilFlag';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { RegisterAccountSection } from '../components/register/RegisterAccountSection';
import { RegisterAddressSection } from '../components/register/RegisterAddressSection';
import { RegisterCompanySection } from '../components/register/RegisterCompanySection';
import type { AnnualRevenue, CompanySize, CompanyType } from '../utils/registerForm';

// Self-service account creation. Flip to `false` to swap the form for an
// "under construction" notice (used while the onboarding / company-verification
// flow was being rebuilt). Typed as `boolean` on purpose so both branches stay
// reachable for the type checker and linter.
const REGISTRATION_ENABLED: boolean = true;

const PAPER_SX = {
  padding: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
} as const;

const HEADER_SX = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
} as const;

/**
 * B2B account creation.
 *
 * The form is split into three memoised sections driven by `useRegisterForm`.
 * That structure is load-bearing, not cosmetic: with all twenty-four inputs in
 * one component every keystroke re-rendered the whole form, which made typing
 * visibly laggy and pushed the two form-filling tests to ~20s each.
 */
const RegisterPage: React.FC = () => {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, setField, error, isLoading, isLoadingCep, handleCepChange, handleSubmit } =
    useRegisterForm();

  const handleBack = () => {
    // Return to the previous in-app page when history exists; otherwise the user
    // deep-linked straight here, so send them to the marketplace home.
    if (location.key && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Each select narrows the incoming string to its own union. Defined with
  // useCallback so the memoised RegisterSelectField sees a stable handler.
  const handleCompanySizeChange = useCallback(
    (value: string) => setField('companySize', value as CompanySize | ''),
    [setField]
  );
  const handleAnnualRevenueChange = useCallback(
    (value: string) => setField('annualRevenue', value as AnnualRevenue | ''),
    [setField]
  );
  const handleIndustrySectorChange = useCallback(
    (value: string) => setField('industrySector', value),
    [setField]
  );
  const handleCompanyTypeChange = useCallback(
    (value: string) => setField('companyType', value as CompanyType),
    [setField]
  );

  const header = (
    <>
      <Box sx={HEADER_SX}>
        <Button onClick={handleBack} startIcon={<ArrowBack />} color='inherit' size='small'>
          {t('common.back')}
        </Button>
        <LanguageSwitcher />
      </Box>
      <Typography component='h1' variant='h4' gutterBottom>
        Cresce
        <BrazilFlag size='0.7em' />
      </Typography>
    </>
  );

  // Registration is under construction: show a notice instead of the form so
  // visitors cannot attempt to create an account. Demo companies on the login
  // page remain the way to explore the marketplace.
  if (!REGISTRATION_ENABLED) {
    return (
      <Container component='main' maxWidth='sm'>
        <Box
          sx={{
            marginTop: 8,
            marginBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={PAPER_SX}>
            {header}

            <Construction sx={{ fontSize: 72, color: 'primary.main', mt: 1, mb: 1 }} />

            <Typography component='h2' variant='h5' align='center' gutterBottom>
              {t('register.underConstruction.title')}
            </Typography>

            <Alert severity='info' sx={{ width: '100%', mt: 1, mb: 3 }}>
              {t('register.underConstruction.message')}
            </Alert>

            <Button fullWidth variant='contained' size='large' onClick={() => navigate('/login')}>
              {t('register.underConstruction.backToLogin')}
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component='main' maxWidth='md'>
      <Box sx={{ marginTop: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={PAPER_SX}>
          {header}
          <Typography component='h2' variant='h6' color='text.secondary' gutterBottom>
            {t('register.subtitle')}
          </Typography>

          {error && (
            <Alert severity='error' sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component='form' onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <Grid container spacing={2}>
              <RegisterAccountSection formData={formData} onFieldChange={setField} />
              <RegisterAddressSection
                formData={formData}
                onFieldChange={setField}
                onCepChange={handleCepChange}
                isLoadingCep={isLoadingCep}
              />
              <RegisterCompanySection
                formData={formData}
                onFieldChange={setField}
                onCompanySizeChange={handleCompanySizeChange}
                onAnnualRevenueChange={handleAnnualRevenueChange}
                onIndustrySectorChange={handleIndustrySectorChange}
                onCompanyTypeChange={handleCompanyTypeChange}
              />
            </Grid>

            <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : t('register.submit')}
            </Button>

            <Box textAlign='center'>
              <Typography variant='body2'>
                {t('register.haveAccount')}
                <Link to='/login' style={{ color: 'inherit', textDecoration: 'underline' }}>
                  {t('register.loginCta')}
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
