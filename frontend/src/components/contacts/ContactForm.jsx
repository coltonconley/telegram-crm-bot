import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Grid, 
  CircularProgress,
  Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { createContact, updateContact } from '../../services/apiService';

export default function ContactForm({ 
  initialData = {}, 
  onSuccess, 
  mode = 'create'
}) {
  const [formData, setFormData] = useState({
    telegram_id: initialData.telegram_id || '',
    display_name: initialData.display_name || '',
    username: initialData.username || '',
    phone_number: initialData.phone_number || '',
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    additional_info: initialData.additional_info || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (mode === 'create') {
        const response = await createContact(formData);
        if (onSuccess) onSuccess(response.data);
      } else {
        const response = await updateContact(initialData.id, formData);
        if (onSuccess) onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error saving contact:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to save contact. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        {mode === 'create' && (
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Telegram ID"
              name="telegram_id"
              value={formData.telegram_id}
              onChange={handleChange}
              disabled={loading || mode === 'edit'}
            />
          </Grid>
        )}
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Display Name"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Information"
            name="additional_info"
            value={formData.additional_info}
            onChange={handleChange}
            multiline
            rows={4}
            disabled={loading}
          />
        </Grid>
      </Grid>
      
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Contact' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
} 