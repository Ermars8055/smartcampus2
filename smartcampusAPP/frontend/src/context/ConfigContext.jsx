import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const { user } = useAuth();
  const [tenantConfig, setTenantConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await api.get('/api/configurations');
      setTenantConfig(res.data);
    } catch (err) {
      console.error('Failed to load tenant configurations:', err);
      setTenantConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfig();
    } else {
      setTenantConfig(null);
      setLoadingConfig(false);
    }
  }, [user]);

  return (
    <ConfigContext.Provider value={{ tenantConfig, fetchConfig, loadingConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
