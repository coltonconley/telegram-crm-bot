import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, CircularProgress,
  Alert, Divider, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, LinearProgress
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { getMLStats, retrainModel } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

// Colors for pie chart
const COLORS = ['#0088cc', '#8774e1', '#4cd964', '#ff9500', '#ff3b30', '#34aadc'];

export default function MLInsights() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [trainingSuccess, setTrainingSuccess] = useState(false);
  
  const { hasTelegramAuth } = useAuth();

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getMLStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching ML stats:', err);
      setError('Failed to load ML statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasTelegramAuth) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [hasTelegramAuth]);

  const handleRetrainModel = async () => {
    setTrainingInProgress(true);
    setTrainingSuccess(false);
    setError('');
    
    try {
      await retrainModel();
      setTrainingSuccess(true);
      // Refresh stats after retraining
      fetchStats();
    } catch (err) {
      console.error('Error retraining model:', err);
      setError('Failed to retrain the ML model');
    } finally {
      setTrainingInProgress(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!stats || !stats.category_distribution) return [];
    
    return Object.entries(stats.category_distribution).map(([name, value]) => ({
      name,
      value
    }));
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
          Please connect your Telegram account to view ML insights
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Machine Learning Insights</Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
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

      {trainingSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Model successfully retrained!
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : stats ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Model Status
              </Typography>
              <Box my={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Model Exists</Typography>
                    <Chip 
                      label={stats.model_exists ? "Yes" : "No"} 
                      color={stats.model_exists ? "success" : "error"} 
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Training Data</Typography>
                    <Typography variant="h5" color="primary">
                      {stats.training_data_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Recent Feedback</Typography>
                    <Typography variant="h5" color="secondary">
                      {stats.recent_feedback_count}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Last Trained</Typography>
                    <Typography variant="body2">
                      {stats.last_trained 
                        ? new Date(stats.last_trained).toLocaleString()
                        : 'Never'
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<PsychologyIcon />}
                onClick={handleRetrainModel}
                disabled={trainingInProgress || stats.training_data_count === 0}
              >
                {trainingInProgress ? 'Training...' : 'Retrain Model'}
              </Button>
              {trainingInProgress && (
                <LinearProgress sx={{ mt: 2 }} color="secondary" />
              )}
              {stats.training_data_count === 0 && (
                <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
                  No training data available
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Category Distribution
              </Typography>
              {Object.keys(stats.category_distribution || {}).length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                  <Typography variant="body1" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              ) : (
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {prepareChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value} messages`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Category Details
              </Typography>
              {Object.keys(stats.category_distribution || {}).length === 0 ? (
                <Box p={2} textAlign="center">
                  <Typography variant="body1" color="text.secondary">
                    No category data available
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box height={300} mb={3}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={prepareChartData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`${value} messages`, 'Count']} />
                        <Bar dataKey="value" fill="#0088cc" name="Messages" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {prepareChartData().map((category) => (
                        <TableRow key={category.name}>
                          <TableCell>
                            <Chip 
                              label={category.name} 
                              size="small" 
                              sx={{ 
                                bgcolor: COLORS[prepareChartData().findIndex(c => c.name === category.name) % COLORS.length],
                                color: 'white' 
                              }} 
                            />
                          </TableCell>
                          <TableCell align="right">{category.value}</TableCell>
                          <TableCell align="right">
                            {(category.value / stats.training_data_count * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Box p={4} textAlign="center">
          <Typography variant="body1" color="text.secondary">
            No ML stats available
          </Typography>
        </Box>
      )}
    </Box>
  );
} 