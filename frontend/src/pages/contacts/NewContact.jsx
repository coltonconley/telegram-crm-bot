import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Divider, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ContactForm from '../../components/contacts/ContactForm';

export default function NewContact() {
  const navigate = useNavigate();
  
  const handleSuccess = (contact) => {
    // Navigate to the newly created contact
    navigate(`/contacts/${contact.id}`);
  };
  
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/contacts')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">Add New Contact</Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <ContactForm 
          mode="create"
          onSuccess={handleSuccess}
        />
      </Paper>
    </Box>
  );
} 