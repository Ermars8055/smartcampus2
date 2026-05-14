import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Badge, Divider, Collapse, useMediaQuery, useTheme, Tooltip, Chip, Select
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Inventory2, ShoppingCart, Warehouse,
  LocalShipping, People, Assessment, Settings, Notifications,
  ExpandLess, ExpandMore, Logout, Person, Store, Assignment,
  SwapHoriz, Undo, Security, ReceiptLong, AccountTree, Category,
  Build, ChevronLeft, RequestQuote, Business
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useEffect } from 'react';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  {
    text: 'Master Data', icon: <Category />, children: [
      { text: 'Materials', icon: <Inventory2 />, path: '/materials' },
      { text: 'Categories', icon: <Category />, path: '/categories' },
      { text: 'Vendors', icon: <People />, path: '/vendors' },
      { text: 'Warehouses', icon: <Warehouse />, path: '/warehouses' },
    ]
  },
  {
    text: 'Procurement', icon: <ShoppingCart />, children: [
      { text: 'Indents', icon: <Assignment />, path: '/indents' },
      { text: 'Purchase Requests', icon: <Assignment />, path: '/purchase-requests' },
      { text: 'Quotations', icon: <RequestQuote />, path: '/quotations' },
      { text: 'Purchase Orders', icon: <ReceiptLong />, path: '/purchase-orders' },
    ]
  },
  {
    text: 'Store Operations', icon: <Store />, children: [
      { text: 'Gate Entry', icon: <Security />, path: '/gate-entry' },
      { text: 'GRN', icon: <LocalShipping />, path: '/grn' },
      { text: 'Material Issue', icon: <Inventory2 />, path: '/issues' },
    ]
  },
  { text: 'Inventory', icon: <Warehouse />, path: '/inventory' },
  { text: 'Intelligence', icon: <Build />, path: '/intelligence' },
  {
    text: 'Reports', icon: <Assessment />, children: [
      { text: 'Issue Summary', icon: <Assessment />, path: '/reports/issue-summary' },
      { text: 'Rate Analysis', icon: <Assessment />, path: '/reports/rate-analysis' },
      { text: 'Receipt Summary', icon: <Assessment />, path: '/reports/receipt-summary' },
      { text: 'Department Inventory', icon: <Assessment />, path: '/reports/department-inventory' },
    ]
  },
  {
    text: 'Admin', icon: <Settings />, children: [
      { text: 'Configurations', icon: <Settings />, path: '/admin' },
      { text: 'Projects', icon: <AccountTree />, path: '/projects' },
      { text: 'Departments', icon: <Business />, path: '/departments' },
    ]
  },
  { text: 'SaaS Admin', icon: <Security />, path: '/saas-admin', platformOnly: true },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ 'Master Data': true });
  const [anchorEl, setAnchorEl] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const { user, tenant, roles, sites, activeSite, activeSiteId, setActiveSiteId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const visibleMenuItems = menuItems.filter((item) => !item.platformOnly || user?.is_platform_admin);

  useEffect(() => {
    api.get('/api/alerts/count').then(r => setAlertCount(r.data.count)).catch(() => { });
  }, [location.pathname]);

  const handleToggle = (text) => {
    setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
  };

  const isActive = (path) => location.pathname === path;

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Logo Area */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box
          component="img"
          src={'/src/assets/logo.jpg'}
          alt="NissiGrid"
          sx={{
            width: 40, height: 40, objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
            NissiGrid
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
            Smart Campus
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto', color: '#94A3B8' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 2 } }}>
        <List disablePadding>
          {visibleMenuItems.map((item) => (
            <Box key={item.text}>
              <ListItem disablePadding sx={{ px: 1, mb: 0.3 }}>
                <ListItemButton
                  onClick={() => {
                    if (item.children) {
                      handleToggle(item.text);
                    } else {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 0.8,
                    px: 1.5,
                    color: isActive(item.path) ? '#fff' : '#94A3B8',
                    background: isActive(item.path) ? 'linear-gradient(90deg, rgba(37,99,235,0.3), rgba(37,99,235,0.1))' : 'transparent',
                    borderLeft: isActive(item.path) ? '3px solid #2563EB' : '3px solid transparent',
                    '&:hover': {
                      background: 'rgba(37,99,235,0.1)',
                      color: '#E2E8F0',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ color: isActive(item.path) ? '#60A5FA' : '#64748B', minWidth: 36, '& svg': { fontSize: '1.2rem' } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ sx: { fontSize: '0.82rem', fontWeight: isActive(item.path) ? 600 : 400 } }} />
                  {item.children && (openMenus[item.text] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />)}
                </ListItemButton>
              </ListItem>
              {item.children && (
                <Collapse in={openMenus[item.text]} timeout="auto">
                  <List disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.text} disablePadding sx={{ px: 1, mb: 0.2 }}>
                        <ListItemButton
                          onClick={() => { navigate(child.path); if (isMobile) setMobileOpen(false); }}
                          sx={{
                            borderRadius: 2,
                            py: 0.6,
                            pl: 5,
                            color: isActive(child.path) ? '#fff' : '#94A3B8',
                            background: isActive(child.path) ? 'rgba(37,99,235,0.2)' : 'transparent',
                            '&:hover': { background: 'rgba(37,99,235,0.08)', color: '#E2E8F0' },
                          }}
                        >
                          <ListItemText primary={child.text} primaryTypographyProps={{ sx: { fontSize: '0.78rem', fontWeight: isActive(child.path) ? 600 : 400 } }} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', fontSize: '0.8rem' }}>
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: '#E2E8F0', fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
              {roles?.join(', ') || 'No Role'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant?.name || 'Platform Admin'}
            </Typography>
            {tenant != null && activeSite && (
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeSite.name}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '@media print': { display: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{ '@media print': { display: 'none' }, width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawer}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <AppBar position="sticky" elevation={0}
          sx={{ '@media print': { display: 'none' }, background: '#fff', borderBottom: '1px solid #E2E8F0', zIndex: 1100 }}>
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#334155' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: '#1E3A8A', fontWeight: 700, fontSize: '1.1rem' }}>
                NissiGrid Smart Campus
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', mt: -0.5, display: 'block' }}>
                Enterprise Materials Governance Platform
              </Typography>
            </Box>

            <Tooltip title="Notifications">
              <IconButton onClick={() => navigate('/alerts')} sx={{ color: '#64748B' }}>
                <Badge badgeContent={alertCount} color="error" max={99}>
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Chip
              avatar={<Avatar sx={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>{user?.full_name?.charAt(0)}</Avatar>}
              label={user?.full_name}
              variant="outlined"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ borderColor: '#E2E8F0', cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }}
            />
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { mt: 1, minWidth: 180 } }}>
              <MenuItem disabled>
                <Person sx={{ mr: 1, fontSize: 18 }} /> {user?.role_name || user?.role}
              </MenuItem>
              <MenuItem disabled>{user?.tenant_name || 'Platform Admin'}</MenuItem>
              <Divider />
              <MenuItem onClick={() => { logout(); navigate('/login'); setAnchorEl(null); }}>
                <Logout sx={{ mr: 1, fontSize: 18 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
