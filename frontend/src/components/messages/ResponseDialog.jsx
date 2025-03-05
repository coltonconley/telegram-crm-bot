import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { respondToMessage } from '../../services/apiService';

export default function ResponseDialog({ 
  open, 
  onClose, 
  messageId, 
  onSuccess 
}) {
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  
  const handleSend = async () => {
    if (!responseText.trim()) return;
    
    setSending(true);
    setError('');
    
    try {
      await respondToMessage(messageId, responseText);
      setResponseText('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Failed to send response. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={sending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Respond to Message</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          id="response"
          label="Your Response"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          disabled={sending}
        />
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={sending}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSend} 
          variant="contained" 
          disabled={!responseText.trim() || sending}
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 