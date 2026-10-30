import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const ACTIVE_SITE_KEY = 'activeSiteId';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [sites, setSites] = useState([]);
  const [activeSiteId, setActiveSiteIdState] = useState(localStorage.getItem(ACTIVE_SITE_KEY) || '');
  const [permissions, setPermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const setActiveSiteId = (siteId) => {
    const value = siteId ? String(siteId) : '';
    setActiveSiteIdState(value);
    if (value) {
      localStorage.setItem(ACTIVE_SITE_KEY, value);
    } else {
      localStorage.removeItem(ACTIVE_SITE_KEY);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem(ACTIVE_SITE_KEY);
    setUser(null);
    setTenant(null);
    setSites([]);
    setPermissions({});
    setRoles([]);
    setActiveSiteIdState('');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');
    if (token && savedUser) {
      let u, t;
      try { u = JSON.parse(savedUser); } catch { u = null; }
      try { t = savedTenant ? JSON.parse(savedTenant) : null; } catch { t = null; }
      if (!u) { logout(); setLoading(false); return; }
      setUser(u);
      if (t) setTenant(t);
      api.get('/api/auth/me').then(res => {
        const data = res.data;
        setUser({ id: data.id, username: data.username, email: data.email, full_name: data.full_name, is_platform_admin: data.is_platform_admin });
        setTenant(data.tenant);
        setSites(data.sites || []);
        setRoles(data.roles || []);
        setPermissions(data.permissions || {});
        if (data.active_site_id && !localStorage.getItem(ACTIVE_SITE_KEY)) {
          setActiveSiteId(data.active_site_id);
        }
      }).catch(() => logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, workspace) => {
    const res = await api.post('/api/auth/login', { username, password, workspace });
    const { access_token, user: userData, tenant: tenantData, sites: sitesData, active_site_id, roles: rolesData, permissions: permsData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (tenantData) localStorage.setItem('tenant', JSON.stringify(tenantData));
    setUser(userData);
    setTenant(tenantData);
    setSites(sitesData || []);
    setRoles(rolesData || []);
    setPermissions(permsData || {});
    if (active_site_id) setActiveSiteId(active_site_id);
    return res.data;
  };

  const hasPermission = (resource, operation = 'can_read') => {
    if (user?.is_platform_admin) return true;
    return permissions[resource]?.[operation] || false;
  };

  const hasAction = (resource, action) => {
    if (user?.is_platform_admin) return true;
    const resPerms = permissions[resource] || {};
    const ext = resPerms.extended_actions || {};
    if (ext[action]) return true;
    // Fallback: if no extended actions at all, fall back to can_update
    if (Object.keys(ext).length === 0 && resPerms.can_update) return true;
    return false;
  };

  const activeSite = sites.find((s) => String(s.id) === String(activeSiteId)) || null;

  return (
    <AuthContext.Provider value={{
      user, tenant, sites, activeSite, activeSiteId, setActiveSiteId,
      permissions, roles, hasPermission, hasAction, login, logout, loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
