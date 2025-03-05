import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="80vh"
          p={3}
        >
          <Paper sx={{ p: 4, maxWidth: 600 }}>
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong!
            </Typography>
            <Typography variant="body1" paragraph>
              We apologize for the inconvenience. The application encountered an unexpected error.
            </Typography>
            <Box sx={{ my: 3 }}>
              <details>
                <summary>
                  <Typography component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                    Technical Details
                  </Typography>
                </summary>
                <Typography component="pre" sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', overflowX: 'auto' }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </details>
            </Box>
            <Box display="flex" gap={2}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<RefreshIcon />} 
                onClick={this.handleReload}
              >
                Reload Page
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<HomeIcon />} 
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary; 