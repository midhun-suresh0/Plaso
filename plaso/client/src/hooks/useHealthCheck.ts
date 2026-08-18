import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface HealthCheckState {
  isConnected: boolean | null;
  isLoading: boolean;
  message: string;
  refresh: () => void;
}

/**
 * Custom hook to check backend health status.
 * Calls GET /health and returns connection state.
 */
export function useHealthCheck(): HealthCheckState {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('Checking connection...');

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/health');

      if (response.success) {
        setIsConnected(true);
        setMessage('Backend Connected');
      } else {
        setIsConnected(false);
        setMessage('Backend Unavailable');
      }
    } catch {
      setIsConnected(false);
      setMessage('Backend Unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { isConnected, isLoading, message, refresh: checkHealth };
}
