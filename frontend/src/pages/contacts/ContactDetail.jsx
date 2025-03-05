import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Divider, Button, TextField, 
  Grid, Avatar, CircularProgress, Alert, IconButton,
  List, ListItem, ListItemText, Tabs, Tab, Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { getContactWithMessages, updateContact } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contact-tabpanel-${index}`}
      aria-labelledby={`contact-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasTelegramAuth } = useAuth();
  
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    display_name: '',
    phone_number: '',
    additional_info: ''
  });
  
  useEffect(() => {
    const fetchContactData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await getContactWithMessages(id);
        setContact(response.data);
        setMessages(response.data.messages || []);
        
        setEditData({
          display_name: response.data.display_name || '',
          phone_number: response.data.phone_number || '',
          additional_info: response.data.additional_info || ''
        });
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('Failed to load contact details');
      } finally {
        setLoading(false);
      }
    };
    
    if (hasTelegramAuth) {
      fetchContactData();
    } else {
      setLoading(false);
    }
  }, [id, hasTelegramAuth]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveChanges = async () => {
    try {
      const response = await updateContact(id, editData);
      setContact(prev => ({
        ...prev,
        ...response.data
      }));
      setEditMode(false);
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact details');
    }
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
          Please connect your Telegram account to view contact details
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/contacts')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Contact Details</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : contact ? (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={2} display="flex" justifyContent="center">
                <Avatar 
                  sx={{ width: 100, height: 100 }}
                  src={contact.photo_url}
                >
                  {contact.display_name?.charAt(0) || contact.first_name?.charAt(0) || '?'}
                </Avatar>
              </Grid>
              <Grid item xs={12} md={10}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h5">
                    {contact.display_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Name'}
                  </Typography>
                  {contact.username && (
                    <Typography variant="body1" color="text.secondary">
                      @{contact.username}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Telegram ID: {contact.telegram_id}
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                    onClick={editMode ? handleSaveChanges : () => setEditMode(true)}
                    sx={{ mr: 1 }}
                  >
                    {editMode ? 'Save' : 'Edit'}
                  </Button>
                  {editMode && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Divider />
          
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Details" />
            <Tab label="Messages" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ p: 3 }}>
              {editMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Display Name"
                      name="display_name"
                      value={editData.display_name}
                      onChange={handleEditChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone_number"
                      value={editData.phone_number}
                      onChange={handleEditChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Additional Information"
                      name="additional_info"
                      value={editData.additional_info}
                      onChange={handleEditChange}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Display Name
                    </Typography>
                    <Typography variant="body1">
                      {contact.display_name || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Phone Number
                    </Typography>
                    <Typography variant="body1">
                      {contact.phone_number || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      First Name
                    </Typography>
                    <Typography variant="body1">
                      {contact.first_name || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Last Name
                    </Typography>
                    <Typography variant="body1">
                      {contact.last_name || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Information
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {contact.additional_info || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Paper>
              {messages.length === 0 ? (
                <Box p={4} textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    No messages found for this contact
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<MessageIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/messages')}
                  >
                    View All Messages
                  </Button>
                </Box>
              ) : (
                <List>
                  {messages.map(message => (
                    <React.Fragment key={message.id}>
                      <ListItem 
                        alignItems="flex-start"
                        button
                        onClick={() => navigate(`/messages/${message.id}`)}
                        sx={{ 
                          bgcolor: message.is_read ? 'transparent' : 'rgba(0, 136, 204, 0.1)'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="subtitle1">
                                {new Date(message.timestamp).toLocaleString()}
                              </Typography>
                              {message.category && (
                                <Chip
                                  label={message.category}
                                  size="small"
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{ display: 'block', mb: 1, mt: 1 }}
                              >
                                {message.message_text || 'No text content'}
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                              >
                                {message.is_responded ? 'Responded' : 'Not responded yet'}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </TabPanel>
        </Box>
      ) : (
        <Box p={4} textAlign="center">
          <Typography variant="body1" color="text.secondary">
            Contact not found
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/contacts')}
            sx={{ mt: 2 }}
          >
            Back to Contacts
          </Button>
        </Box>
      )}
    </Box>
  );
} 