import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMessages, getContacts, getUnrespondedMessages, getMLStats } from '../services/apiService';
import { useAuth } from './AuthContext';

const StatsContext = createContext();

export function useStats() {
  return useContext(StatsContext);
}

export function StatsProvider({ children }) {
  const [stats, setStats] = useState({
    messages: {
      total: 0,
      unresponded: 0,
      categories: {}
    },
    contacts: {
      total: 0
    },
    ml: {
      model_exists: false,
      training_data_count: 0,
      last_trained: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hasTelegramAuth } = useAuth();

  // Function to refresh all stats
  const refreshStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Only fetch if user has Telegram auth
      if (!hasTelegramAuth) {
        setLoading(false);
        return;
      }
      
      // Fetch message stats
      const messagesResponse = await getMessages({ limit: 1 });
      const totalMessages = parseInt(messagesResponse.headers['x-total-count'] || '0', 10);
      
      // Fetch unresponded messages
      const unrespondedResponse = await getUnrespondedMessages({ limit: 1 });
      const totalUnresponded = parseInt(unrespondedResponse.headers['x-total-count'] || '0', 10);
      
      // Fetch contact stats
      const contactsResponse = await getContacts({ limit: 1 });
      const totalContacts = parseInt(contactsResponse.headers['x-total-count'] || '0', 10);
      
      // Fetch ML stats
      const mlStatsResponse = await getMLStats();
      const mlStats = mlStatsResponse.data;
      
      setStats({
        messages: {
          total: totalMessages,
          unresponded: totalUnresponded,
          categories: mlStats.category_distribution || {}
        },
        contacts: {
          total: totalContacts
        },
        ml: {
          model_exists: mlStats.model_exists || false,
          training_data_count: mlStats.training_data_count || 0,
          last_trained: mlStats.last_trained || null
        }
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Initialize stats
  useEffect(() => {
    refreshStats();
  }, [hasTelegramAuth]);

  const value = {
    stats,
    loading,
    error,
    refreshStats
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
} 