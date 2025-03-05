import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Paper, Typography, Card, CardContent, 
  CircularProgress, Button, List, ListItem, ListItemText,
  Divider, Alert, IconButton, ListItemIcon, ListItemSecondaryAction, CardActions
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Reply as ReplyIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorOutlineIcon,
  HelpOutline as HelpOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  AnalyticsOutlined as AnalyticsIcon
} from '@mui/icons-material';
import { 
  getMessages, getContacts, getUnrespondedMessages,
  getMLStats, respondToMessage
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import ResponseDialog from '../components/messages/ResponseDialog';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [unrespondedMessages, setUnrespondedMessages] = useState([]);
  const [messageCounts, setMessageCounts] = useState({
    total: 0,
    unresponded: 0,
  });
  const [contactCount, setContactCount] = useState(0);
  const [mlStats, setMlStats] = useState(null);
  const [error, setError] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const navigate = useNavigate();
  const { hasTelegramAuth } = useAuth();
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useStats();
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const [messagesRes, unrespondedRes, contactsRes, mlStatsRes] = await Promise.all([
          getMessages({ limit: 1 }),
          getUnrespondedMessages({ limit: 5 }),
          getContacts({ limit: 1 }),
          getMLStats(),
        ]);
        
        setUnrespondedMessages(unrespondedRes.data);
        setMessageCounts({
          total: messagesRes.headers['x-total-count'] || 0,
          unresponded: unrespondedRes.headers['x-total-count'] || 0,
        });
        setContactCount(contactsRes.headers['x-total-count'] || 0);
        setMlStats(mlStatsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (hasTelegramAuth) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [hasTelegramAuth]);

  useEffect(() => {
    const fetchRecentMessages = async () => {
      if (!hasTelegramAuth) return;
      
      try {
        const response = await getUnrespondedMessages({ limit: 5 });
        setRecentMessages(response.data);
      } catch (err) {
        console.error('Error fetching recent messages:', err);
      }
    };
    
    fetchRecentMessages();
  }, [hasTelegramAuth]);

  const handleQuickReply = async (messageId, text) => {
    setRespondingTo(messageId);
    try {
      await respondToMessage(messageId, text);
      // Remove the responded message from the list
      setUnrespondedMessages(prev => 
        prev.filter(message => message.id !== messageId)
      );
      // Update the counts
      setMessageCounts(prev => ({
        ...prev,
        unresponded: prev.unresponded - 1
      }));
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRespond = (messageId) => {
    setRespondingTo(messageId);
  };

  const handleResponseSuccess = async () => {
    setRespondingTo(null);
    // Refresh unresponded messages
    const response = await getUnrespondedMessages({ limit: 5 });
    setRecentMessages(response.data);
    // Refresh stats
    refreshStats();
  };

  const StatCard = ({ icon, title, value, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
          Please connect your Telegram account to use the CRM features
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Dashboard</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={refreshStats}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<MessageIcon color="primary" />}
            title="Total Messages"
            value={messageCounts.total}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<ReplyIcon color="error" />}
            title="Unresponded Messages"
            value={messageCounts.unresponded}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<PeopleIcon color="info" />}
            title="Total Contacts"
            value={contactCount}
            color="info"
          />
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Unresponded Messages
            </Typography>
            
            {recentMessages.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography variant="body1" color="text.secondary">
                  No unresponded messages
                </Typography>
              </Box>
            ) : (
              <List>
                {recentMessages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box>
                          <IconButton 
                            edge="end" 
                            color="primary"
                            disabled={respondingTo === message.id}
                            onClick={() => navigate(`/messages/${message.id}`)}
                          >
                            <ReplyIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle1"
                            color="text.primary"
                            sx={{ fontWeight: 500 }}
                          >
                            {message.message_text && message.message_text.length > 50 
                              ? `${message.message_text.substring(0, 50)}...` 
                              : message.message_text || 'No text content'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {new Date(message.timestamp).toLocaleString()}
                            </Typography>
                            {message.category && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ 
                                  ml: 1, 
                                  bgcolor: 'primary.light', 
                                  color: 'white',
                                  px: 1, 
                                  py: 0.5, 
                                  borderRadius: 1 
                                }}
                              >
                                {message.category}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentMessages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button 
                variant="contained" 
                onClick={() => navigate('/messages')}
                startIcon={<MessageIcon />}
              >
                View All Messages
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              ML Model Statistics
            </Typography>
            
            {!mlStats ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography variant="body1" color="text.secondary">
                  ML statistics not available
                </Typography>
              </Box>
            ) : (
              <>
                <Box my={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Training Data
                  </Typography>
                  <Typography variant="h4">
                    {mlStats.training_data_count}
                  </Typography>
                </Box>
                
                <Box my={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Model Status
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CheckCircleIcon 
                      color={mlStats.model_exists ? "success" : "error"} 
                      sx={{ mr: 1 }}
                    />
                    <Typography>
                      {mlStats.model_exists ? "Model trained and ready" : "Model needs training"}
                    </Typography>
                  </Box>
                </Box>
                
                {mlStats.last_trained && (
                  <Box my={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Last Trained
                    </Typography>
                    <Typography>
                      {new Date(mlStats.last_trained).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                <Box mt={3} display="flex" justifyContent="flex-end">
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/ml-insights')}
                    startIcon={<DashboardIcon />}
                  >
                    ML Insights
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Categorization
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ErrorOutlineIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Requiring Followup" 
                    secondary={`${stats.messages.ai_categories?.followup_required || 0} messages`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HelpOutlineIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Needing Review" 
                    secondary={`${stats.messages.ai_categories?.unsure_ask_user || 0} messages`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Not Important" 
                    secondary={`${stats.messages.ai_categories?.not_important || 0} messages`} 
                  />
                </ListItem>
              </List>
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                startIcon={<AnalyticsIcon />}
                onClick={() => navigate('/messages?ai_category=unsure_ask_user')}
              >
                Review Uncertain Messages
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <ResponseDialog
        open={!!respondingTo}
        onClose={() => setRespondingTo(null)}
        messageId={respondingTo}
        onSuccess={handleResponseSuccess}
      />
    </Box>
  );
} 