import { useState } from 'react';
import { ListItem, ListItemSecondaryAction, IconButton, CircularProgress } from '@mui/material';
import { AnalyticsOutlined as AnalyticsIcon } from '@mui/icons-material';
import { categorizeMessage } from '../../services/apiService';

export default function MessageListItem({ message, onRefresh }) {
  const [categorizing, setCategorizing] = useState(false);
  
  const handleCategorize = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCategorizing(true);
    try {
      await categorizeMessage(message.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error categorizing message:', err);
    } finally {
      setCategorizing(false);
    }
  };
  
  return (
    <ListItem>
      <ListItemSecondaryAction>
        <IconButton 
          edge="end" 
          aria-label="categorize" 
          onClick={handleCategorize}
          disabled={categorizing}
        >
          {categorizing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
} 