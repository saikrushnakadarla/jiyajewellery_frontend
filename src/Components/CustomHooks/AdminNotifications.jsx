// src/hooks/useAdminNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const eventSource = new EventSource(`${baseURL}/api/admin-notifications`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection established');
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received notification:', data);
        
        if (data.type === 'connected') {
          console.log('Connected to notification stream');
          return;
        }
        
        // Add to notifications list
        setNotifications(prev => [data, ...prev].slice(0, 50));
        
        // Show toast notification
        showToastNotification(data);
        
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      eventSource.close();
      
      // Try to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect SSE...');
        connect();
      }, 5000);
    };
  }, []);

  const showToastNotification = (notification) => {
    const { type, estimate_number, customer_name, old_status, new_status, message } = notification;
    
    let toastMessage = '';
    let toastType = 'info';
    
    if (type === 'NEW_ESTIMATE') {
      toastMessage = `🆕 New Estimate #${estimate_number} from ${customer_name || 'Customer'}`;
      toastType = 'info';
    } else if (type === 'STATUS_CHANGE') {
      toastMessage = `📝 Estimate #${estimate_number} status changed: ${old_status} → ${new_status}`;
      toastType = new_status === 'Ordered' ? 'success' : new_status === 'Rejected' ? 'error' : 'warning';
    }
    
    // Use toast notification
    toast(toastMessage, {
      type: toastType,
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClick: () => {
        // Optional: redirect to estimate details
        window.location.href = `/estimation/${estimate_number}`;
      }
    });
  };

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    notifications,
    isConnected,
    clearNotifications,
    disconnect,
    reconnect: connect
  };
};

export default useAdminNotifications;