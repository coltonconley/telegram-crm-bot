import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Auth Components
import Login from './pages/auth/Login';
import TelegramAuth from './pages/auth/TelegramAuth';

// Layout Components
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Main Pages
import Dashboard from './pages/Dashboard';
import MessagesList from './pages/messages/MessagesList';
import MessageDetail from './pages/messages/MessageDetail';
import ContactsList from './pages/contacts/ContactsList';
import ContactDetail from './pages/contacts/ContactDetail';
import NewContact from './pages/contacts/NewContact';
import MLInsights from './pages/ml/MLInsights';
import Settings from './pages/Settings';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { StatsProvider } from './contexts/StatsContext';

// API
import { getAuthToken } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Check auth status on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
  };

  return (
    <ErrorBoundary>
      <AuthProvider value={{ isAuthenticated, setIsAuthenticated }}>
        <StatsProvider>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/telegram-auth" element={
                <ProtectedRoute>
                  <TelegramAuth />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="messages" element={<MessagesList />} />
                <Route path="messages/:id" element={<MessageDetail />} />
                <Route path="contacts" element={<ContactsList />} />
                <Route path="contacts/new" element={<NewContact />} />
                <Route path="contacts/:id" element={<ContactDetail />} />
                <Route path="ml-insights" element={<MLInsights />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </StatsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 