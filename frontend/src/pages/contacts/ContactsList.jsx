import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Avatar, IconButton, 
  CircularProgress, TextField, InputAdornment, Alert, Button,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { getContacts } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

export default function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { hasTelegramAuth } = useAuth();

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const skip = page * rowsPerPage;
      const response = await getContacts({
        skip,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      });
      
      setContacts(response.data);
      setTotalCount(parseInt(response.headers['x-total-count'] || '0', 10));
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasTelegramAuth) {
      fetchContacts();
    } else {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, hasTelegramAuth]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchTerm('');
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
          Please connect your Telegram account to view contacts
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Contacts</Typography>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/contacts/new')}
        >
          Add Contact
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search contacts by name, username, or phone number..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : contacts.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              No contacts found
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contact</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Last Contact</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ mr: 2 }}
                            src={contact.photo_url}
                          >
                            {contact.display_name?.charAt(0) || contact.first_name?.charAt(0) || '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {contact.display_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Name'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {contact.telegram_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {contact.username ? `@${contact.username}` : '—'}
                      </TableCell>
                      <TableCell>
                        {contact.phone_number || '—'}
                      </TableCell>
                      <TableCell>
                        {contact.last_message_time 
                          ? new Date(contact.last_message_time).toLocaleString() 
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton onClick={() => navigate(`/contacts/${contact.id}`)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
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