import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Chip, IconButton, 
  CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem,
  Tooltip, Button, Alert, Grid
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Reply as ReplyIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { getMessages } from '../../services/apiService';
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

// AI category options
const AI_CATEGORIES = [
  { value: 'not_important', label: 'Not Important' },
  { value: 'followup_required', label: 'Followup Required' },
  { value: 'unsure_ask_user', label: 'Needs Review' }
];

export default function MessagesList() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    is_responded: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [aiCategoryFilter, setAiCategoryFilter] = useState('');
  
  const navigate = useNavigate();
  const { hasTelegramAuth } = useAuth();

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const skip = page * rowsPerPage;
      const response = await getMessages({
        skip,
        limit: rowsPerPage,
        ...filters,
        ai_category: aiCategoryFilter,
        search: filters.search || undefined, // Don't send empty string
      });
      
      setMessages(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, aiCategoryFilter]);

  useEffect(() => {
    if (hasTelegramAuth) {
      fetchMessages();
    } else {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, hasTelegramAuth, aiCategoryFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      is_responded: '',
      search: '',
    });
    setPage(0);
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
          Please connect your Telegram account to view messages
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Messages</Typography>
        <Button 
          variant="contained" 
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Search Messages"
                fullWidth
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                placeholder="Search message text..."
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {CATEGORIES.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.is_responded}
                  onChange={(e) => handleFilterChange('is_responded', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="false">Unresponded</MenuItem>
                  <MenuItem value="true">Responded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
                <InputLabel>AI Category</InputLabel>
                <Select
                  value={aiCategoryFilter}
                  onChange={(e) => setAiCategoryFilter(e.target.value)}
                  label="AI Category"
                >
                  <MenuItem value="">All</MenuItem>
                  {AI_CATEGORIES.map(category => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              No messages found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Sender</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id} hover>
                      <TableCell>
                        {new Date(message.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {message.message_text && message.message_text.length > 50 
                          ? `${message.message_text.substring(0, 50)}...` 
                          : message.message_text || 'No text content'}
                      </TableCell>
                      <TableCell>{message.sender_id}</TableCell>
                      <TableCell>
                        {message.category && (
                          <Chip 
                            label={message.category} 
                            color="primary" 
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={message.is_responded ? 'Responded' : 'Pending'} 
                          color={message.is_responded ? 'success' : 'warning'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton onClick={() => navigate(`/messages/${message.id}`)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        {!message.is_responded && (
                          <Tooltip title="Respond">
                            <IconButton 
                              color="primary"
                              onClick={() => navigate(`/messages/${message.id}?respond=true`)}
                            >
                              <ReplyIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
} 