import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Divider, Button, TextField,
  Grid, CircularProgress, Alert, Switch, FormControlLabel,
  Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import { getUserSettings, updateUserSettings, resetTelegramSession } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    auto_categorization: true,
    theme: 'light'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const navigate = useNavigate();
  const { hasTelegramAuth, setHasTelegramAuth } = useAuth();

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getUserSettings();
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingChange = (e) => {
    const { name, checked, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserSettings(settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTelegramSession = async () => {
    setShowResetDialog(false);
    setLoading(true);
    setError('');
    
    try {
      await resetTelegramSession();
      setHasTelegramAuth(false);
      setSuccess('Telegram session reset successfully');
      navigate('/telegram-auth');
    } catch (err) {
      console.error('Error resetting Telegram session:', err);
      setError('Failed to reset Telegram session');
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>Settings</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={success}
      />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Preferences
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications_enabled}
                      onChange={handleSettingChange}
                      name="notifications_enabled"
                    />
                  }
                  label="Enable Notifications"
                  sx={{ display: 'block', mb: 2 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.auto_categorization}
                      onChange={handleSettingChange}
                      name="auto_categorization"
                    />
                  }
                  label="Auto-categorize New Messages with ML"
                  sx={{ display: 'block', mb: 2 }}
                />
                
                <Box mt={4}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSettings}
                    disabled={saving}
                    sx={{ mr: 2 }}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account & Telegram
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Telegram Connection
              </Typography>
              <Typography variant="body2" gutterBottom color={hasTelegramAuth ? 'success.main' : 'error.main'}>
                {hasTelegramAuth ? 'Connected' : 'Not Connected'}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={hasTelegramAuth ? <SyncIcon /> : <SyncIcon />}
                onClick={() => navigate('/telegram-auth')}
                sx={{ mt: 1 }}
              >
                {hasTelegramAuth ? 'Reconnect' : 'Connect'} Telegram
              </Button>
            </Box>
            
            {hasTelegramAuth && (
              <Box mt={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Reset Telegram Session
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This will remove your current Telegram session and require you to reconnect.
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<LockResetIcon />}
                  onClick={() => setShowResetDialog(true)}
                >
                  Reset Telegram Connection
                </Button>
              </Box>
            )}
            
            <Box mt={5}>
              <Typography variant="subtitle2" gutterBottom>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Permanently delete your account and all associated data.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
      >
        <DialogTitle>Reset Telegram Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset your Telegram session? You'll need to reconnect your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetTelegramSession} color="error" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 