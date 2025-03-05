import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, Typography, Paper, Container, 
  Alert, Stepper, Step, StepLabel, CircularProgress 
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { startTelegramAuth, confirmTelegramAuth } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const phoneRegExp = /^(\+?\d{0,4})?\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{4}\)?)?$/;

const PhoneSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(phoneRegExp, 'Phone number is not valid')
    .required('Phone number is required'),
});

const CodeSchema = Yup.object().shape({
  code: Yup.string()
    .matches(/^\d+$/, 'Code must contain only digits')
    .required('Code is required'),
});

const steps = ['Enter Phone Number', 'Enter Verification Code'];

export default function TelegramAuth() {
  const [activeStep, setActiveStep] = useState(0);
  const [authId, setAuthId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setHasTelegramAuth } = useAuth();

  const handlePhoneSubmit = async (values) => {
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await startTelegramAuth(values.phone);
      setAuthId(response.data.auth_id);
      setActiveStep(1);
    } catch (err) {
      console.error('Telegram auth error:', err);
      let errorMessage = 'Failed to start Telegram authentication';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (values) => {
    setError('');
    setIsSubmitting(true);
    
    try {
      await confirmTelegramAuth(authId, values.code);
      setHasTelegramAuth(true);
      navigate('/');
    } catch (err) {
      console.error('Telegram code verification error:', err);
      let errorMessage = 'Failed to verify the code';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Telegram Authentication
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {activeStep === 0 ? (
            <>
              <Typography variant="body1" gutterBottom align="center">
                Please enter your Telegram phone number to authenticate with Telegram.
              </Typography>
              <Formik
                initialValues={{ phone: '' }}
                validationSchema={PhoneSchema}
                onSubmit={handlePhoneSubmit}
              >
                {({ errors, touched }) => (
                  <Form style={{ width: '100%' }}>
                    <Field
                      as={TextField}
                      margin="normal"
                      fullWidth
                      id="phone"
                      label="Phone Number (with country code)"
                      name="phone"
                      autoComplete="tel"
                      placeholder="+1234567890"
                      autoFocus
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Next'}
                    </Button>
                  </Form>
                )}
              </Formik>
            </>
          ) : (
            <>
              <Typography variant="body1" gutterBottom align="center">
                Please enter the verification code sent to your Telegram account.
              </Typography>
              <Formik
                initialValues={{ code: '' }}
                validationSchema={CodeSchema}
                onSubmit={handleCodeSubmit}
              >
                {({ errors, touched }) => (
                  <Form style={{ width: '100%' }}>
                    <Field
                      as={TextField}
                      margin="normal"
                      fullWidth
                      id="code"
                      label="Verification Code"
                      name="code"
                      autoFocus
                      error={touched.code && Boolean(errors.code)}
                      helperText={touched.code && errors.code}
                    />
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Verify Code'}
                    </Button>
                    <Button
                      type="button"
                      fullWidth
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                  </Form>
                )}
              </Formik>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
} 