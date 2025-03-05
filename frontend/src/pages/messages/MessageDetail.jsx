import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Paper, Typography, Divider, Button, TextField, 
  Grid, Chip, CircularProgress, Alert, IconButton,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Person as PersonIcon,
  AnalyticsOutlined as AnalyticsIcon
} from '@mui/icons-material';
import { 
  getMessage, respondToMessage, updateMessage,
  predictMessageCategory, submitMLFeedback, categorizeMessage
} from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

// Category options
const CATEGORIES = [
  'Question',
  'Complaint',
  'Feedback',
  'Request',
  'Information',
  'Other'
];

export default function MessageDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { hasTelegramAuth } = useAuth();
  
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    category: '',
    priority: 'Medium',
    action_notes: ''
  });
  const [categorizing, setCategorizing] = useState(false);
  
  // Check URL params for auto-focus on respond
  const searchParams = new URLSearchParams(location.search);
  const shouldRespond = searchParams.get('respond') === 'true';
  
  useEffect(() => {
    const fetchMessage = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await getMessage(id);
        setMessage(response.data);
        setEditData({
          category: response.data.category || '',
          priority: response.data.priority || 'Medium',
          action_notes: response.data.action_notes || ''
        });
      } catch (err) {
        console.error('Error fetching message:', err);
        setError('Failed to load message details');
      } finally {
        setLoading(false);
      }
    };
    
    if (hasTelegramAuth) {
      fetchMessage();
    } else {
      setLoading(false);
    }
  }, [id, hasTelegramAuth]);
  
  const handleSendResponse = async () => {
    if (!responseText.trim()) return;
    
    setSending(true);
    setError('');
    
    try {
      await respondToMessage(id, responseText);
      
      // Update local state
      setMessage(prev => ({
        ...prev,
        is_responded: true
      }));
      
      setResponseText('');
    } catch (err) {
      console.error('Error sending response:', err);
      setError('Failed to send response');
    } finally {
      setSending(false);
    }
  };
  
  const handlePredict = async () => {
    setPredicting(true);
    setError('');
    
    try {
      const response = await predictMessageCategory(id);
      setPrediction(response.data);
      
      // Set the predicted category
      if (!editData.category) {
        setEditData(prev => ({
          ...prev,
          category: response.data.predicted_category
        }));
      }
    } catch (err) {
      console.error('Error predicting category:', err);
      setError('Failed to predict message category');
    } finally {
      setPredicting(false);
    }
  };
  
  const handleProvideMLFeedback = async (correctCategory) => {
    try {
      await submitMLFeedback(id, correctCategory);
      setPrediction(prev => ({
        ...prev,
        predicted_category: correctCategory
      }));
      setEditData(prev => ({
        ...prev,
        category: correctCategory
      }));
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    }
  };
  
  const handleSaveChanges = async () => {
    try {
      await updateMessage(id, editData);
      
      // Update local state
      setMessage(prev => ({
        ...prev,
        ...editData
      }));
      
      setEditMode(false);
    } catch (err) {
      console.error('Error updating message:', err);
      setError('Failed to update message');
    }
  };
  
  const handleAICategorize = async () => {
    setCategorizing(true);
    setError('');
    
    try {
      const response = await categorizeMessage(id);
      // Update the message with the new AI categorization
      setMessage(response.data);
    } catch (err) {
      console.error('Error categorizing message:', err);
      setError('Failed to categorize message with AI');
    } finally {
      setCategorizing(false);
    }
  };
  
  const getCategoryBadge = (aiCategory) => {
    if (!aiCategory) return null;
    
    let color, label;
    switch (aiCategory) {
      case 'not_important':
        color = 'default';
        label = 'Not Important';
        break;
      case 'followup_required':
        color = 'error';
        label = 'Followup Required';
        break;
      case 'unsure_ask_user':
        color = 'warning';
        label = 'Needs Review';
        break;
      default:
        color = 'default';
        label = aiCategory;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  if (!hasTelegramAuth) {
    return (
      <Box mt={4}>
        <Alert 
          severity="warning" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/telegram-auth')}>
              Connect
            </Button>
          }
        >
          Please connect your Telegram account to view message details
        </Alert>
      </Box>
    );
  }
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!message) {
    return (
      <Box mt={4}>
        <Alert severity="error">
          Message not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/messages')}
          sx={{ mt: 2 }}
        >
          Back to Messages
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/messages')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Message Details</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Message</Typography>
              <Chip 
                label={message.is_responded ? 'Responded' : 'Pending Response'} 
                color={message.is_responded ? 'success' : 'warning'} 
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Received: {new Date(message.timestamp).toLocaleString()}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {message.message_text || 'No text content'}
            </Typography>
            
            {message.media_info && (
              <Box mt={2} mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Media Attachments:
                </Typography>
                <Typography variant="body2">
                  {typeof message.media_info === 'string' 
                    ? message.media_info 
                    : JSON.stringify(message.media_info, null, 2)}
                </Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PersonIcon />}
                onClick={() => navigate(`/contacts/${message.sender_id}`)}
                sx={{ mr: 2 }}
              >
                View Contact
              </Button>
            </Box>
          </Paper>
          
          {!message.is_responded && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Send Response
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your response here..."
                variant="outlined"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                sx={{ mb: 2 }}
                autoFocus={shouldRespond}
              />
              
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={handleSendResponse}
                disabled={sending || !responseText.trim()}
              >
                {sending ? <CircularProgress size={24} /> : 'Send Response'}
              </Button>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {editMode ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Edit Details
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editData.category}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                    label="Category"
                  >
                    <MenuItem value="">Not Categorized</MenuItem>
                    {CATEGORIES.map(category => (
                      <MenuItem key={category} value={category}>{category}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editData.priority}
                    onChange={(e) => setEditData({...editData, priority: e.target.value})}
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Action Notes"
                  placeholder="Add action notes..."
                  variant="outlined"
                  value={editData.action_notes}
                  onChange={(e) => setEditData({...editData, action_notes: e.target.value})}
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" justifyContent="space-between">
                  <Button 
                    variant="outlined" 
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" gutterBottom>
                    Details
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Category
                </Typography>
                {message.category ? (
                  <Chip 
                    label={message.category} 
                    color="primary" 
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Not categorized
                  </Typography>
                )}
                
                <Typography variant="subtitle2" gutterBottom>
                  Priority
                </Typography>
                <Chip 
                  label={message.priority || 'Medium'} 
                  color={
                    message.priority === 'Urgent' ? 'error' :
                    message.priority === 'High' ? 'warning' :
                    message.priority === 'Low' ? 'success' : 'info'
                  } 
                  sx={{ mb: 2 }}
                />
                
                {message.action_notes && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                      Action Notes
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                      {message.action_notes}
                    </Typography>
                  </>
                )}
              </>
            )}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ML Categorization
            </Typography>
            
            {prediction ? (
              <>
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Predicted Category
                  </Typography>
                  <Chip 
                    label={prediction.predicted_category} 
                    color="secondary" 
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Provide Feedback
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {CATEGORIES.map(category => (
                    <Chip
                      key={category}
                      label={category}
                      clickable
                      color={prediction.predicted_category === category ? 'secondary' : 'default'}
                      onClick={() => handleProvideMLFeedback(category)}
                    />
                  ))}
                </Box>
              </>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Use ML to automatically categorize this message
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handlePredict}
                  disabled={predicting}
                  sx={{ mt: 1 }}
                >
                  {predicting ? <CircularProgress size={24} /> : 'Predict Category'}
                </Button>
              </Box>
            )}
          </Paper>
          
          <Box my={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" gutterBottom>
                AI Categorization
              </Typography>
              <Button
                size="small"
                startIcon={categorizing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                onClick={handleAICategorize}
                disabled={categorizing}
                variant="outlined"
              >
                {categorizing ? 'Categorizing...' : 'Categorize with AI'}
              </Button>
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              {getCategoryBadge(message.ai_category)}
              {message.ai_confidence && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  Confidence: {(message.ai_confidence * 100).toFixed(1)}%
                </Typography>
              )}
            </Box>
            {message.ai_reasoning && (
              <Typography variant="body2">
                {message.ai_reasoning}
              </Typography>
            )}
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 