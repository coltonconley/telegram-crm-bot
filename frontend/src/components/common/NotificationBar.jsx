import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert,
  Button
} from '@mui/material';

/**
 * A reusable notification component for displaying success, error, info messages
 */
export default function NotificationBar({ 
  message = '',
  severity = 'info', // 'error', 'warning', 'info', 'success'
  duration = 6000,
  action = null,
  open = false,
  onClose = () => {}
}) {
  const [isOpen, setIsOpen] = useState(open);
  
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    onClose();
  };
  
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        sx={{ width: '100%' }}
        action={action}
      >
        {message}
      </Alert>
    </Snackbar>
  );
} 