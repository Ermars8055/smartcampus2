import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Badge, Divider, Collapse, useMediaQuery, useTheme, Tooltip, Chip, Select,
  Snackbar, Alert, Slide, Button
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Inventory2, ShoppingCart, Warehouse,
  LocalShipping, People, Assessment, Settings, Notifications,
  ExpandLess, ExpandMore, Logout, Person, Store, Assignment,
  SwapHoriz, Undo, Security, ReceiptLong, AccountTree, Category,
  Build, ChevronLeft, RequestQuote, Business, AssignmentTurnedIn, Straighten,
  AccountBalance, Campaign
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logoImg from '../assets/logo.png';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/', resource: 'dashboard' },
  {
    text: 'Master Data', icon: <Category />, children: [
      { text: 'Materials', icon: <Inventory2 />, path: '/materials', resource: 'materials' },
      { text: 'Categories', icon: <Category />, path: '/categories', resource: 'categories' },
      { text: 'Sub Categories', icon: <Category />, path: '/subcategories', resource: 'subcategories' },
      { text: 'UOM', icon: <Straighten />, path: '/uom', resource: 'uom' },
      { text: 'Vendors', icon: <People />, path: '/vendors', resource: 'vendors' },
      { text: 'Stores', icon: <Warehouse />, path: '/warehouses', resource: 'warehouses' },
    ]
  },
  {
    text: 'Procurement', icon: <ShoppingCart />, children: [
      { text: 'Indents', icon: <Assignment />, path: '/indents', resource: 'indents' },
      { text: 'Purchase Requests', icon: <Assignment />, path: '/purchase-requests', resource: 'purchase_requests' },
      { text: 'Quotations', icon: <RequestQuote />, path: '/quotations', resource: 'quotations' },
      { text: 'Purchase Orders', icon: <ReceiptLong />, path: '/purchase-orders', resource: 'purchase_orders' },
    ]
  },
  {
    text: 'Store Operations', icon: <Store />, children: [
      { text: 'Gate Entry', icon: <Security />, path: '/gate-entry', resource: 'gate_entry' },
      { text: 'Invoices', icon: <ReceiptLong />, path: '/invoices', resource: 'invoice' },
      { text: 'GRN', icon: <LocalShipping />, path: '/grn', resource: 'grn' },
      { text: 'Material Issue', icon: <Inventory2 />, path: '/issues', resource: 'issues' },
      { text: 'Returns', icon: <Undo />, path: '/returns', resource: 'returns' },
      { text: 'Stock Transfer', icon: <SwapHoriz />, path: '/transfers', resource: 'transfers' },
      { text: 'Gate Pass', icon: <LocalShipping />, path: '/gate-passes', resource: 'gate_passes' },
      { text: 'Issue Acknowledgement', icon: <AssignmentTurnedIn />, path: '/pending-acknowledgments', resource: 'acknowledgements' },
    ]
  },
  { text: 'Inventory', icon: <Warehouse />, path: '/inventory', resource: 'inventory' },
  {
    text: 'Maintenance', icon: <Build />, children: [
      { text: 'Complaints', icon: <Assignment />, path: '/complaints', resource: 'complaints' },
    ]
  },
  { text: 'Intelligence', icon: <Build />, path: '/intelligence', resource: 'intelligence' },
  {
    text: 'Finance', icon: <AccountBalance />, children: [
      { text: 'Invoice Tracking', icon: <AssignmentTurnedIn />, path: '/invoice-tracking', resource: 'finance_invoices' },
      { text: 'Pending Invoices Report', icon: <Assessment />, path: '/finance/reports/pending-invoices', resource: 'report_finance' },
      { text: 'Pending Payments Report', icon: <Assessment />, path: '/finance/reports/pending-payments', resource: 'report_finance' },
    ]
  },
  {
    text: 'Reports', icon: <Assessment />, children: [
      { text: 'General Reports', icon: <Assessment />, path: '/reports', resource: 'reports' },
      { text: 'Issue Summary', icon: <Assessment />, path: '/reports/issue-summary', resource: 'report_issue_summary' },
      { text: 'Rate Analysis', icon: <Assessment />, path: '/reports/rate-analysis', resource: 'report_rate_analysis' },
      { text: 'Receipt Summary', icon: <Assessment />, path: '/reports/receipt-summary', resource: 'report_receipt_summary' },
      { text: 'Department Inventory', icon: <Assessment />, path: '/reports/department-inventory', resource: 'report_dept_inventory' },
      { text: 'Pending Gatepass Returns', icon: <Assessment />, path: '/reports/pending-gatepass-returns', resource: 'report_pending_gatepass' },
    ]
  },
  {
    text: 'Admin', icon: <Settings />, children: [
      { text: 'Users', icon: <People />, path: '/admin/users', resource: 'admin_users' },
      { text: 'Audit Logs', icon: <Assessment />, path: '/admin/audit-logs', resource: 'audit_logs' },
      { text: 'Approval Flows', icon: <AccountTree />, path: '/admin/approval-flows', resource: 'approval_flows' },
      { text: 'Roles', icon: <Security />, path: '/admin/roles', resource: 'admin_roles' },
      { text: 'Material Allowances', icon: <Inventory2 />, path: '/admin/material-allowances', resource: 'material_allowances' },
      { text: 'Configurations', icon: <Settings />, path: '/admin/configurations', resource: 'configurations' },
      { text: 'Projects', icon: <AccountTree />, path: '/projects', resource: 'projects' },
      { text: 'Terms & Conditions', icon: <Assignment />, path: '/terms', resource: 'terms' },
      { text: 'Company Addresses', icon: <Business />, path: '/company-addresses', resource: 'company_addresses' },
    ]
  },
  { text: 'SaaS Admin', icon: <Security />, path: '/saas-admin', platformOnly: true },
];

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const getSubmoduleStyle = (isActivePath) => ({
  borderRadius: 0,
  borderLeft: isActivePath ? '3px solid #60A5FA' : '3px solid transparent',
  py: 0.6,
  pl: isActivePath ? 4.5 : 5,
  color: isActivePath ? '#60A5FA' : '#94A3B8',
  background: isActivePath ? 'rgba(37,99,235,0.15)' : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': { 
    background: isActivePath ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)', 
    color: isActivePath ? '#93C5FD' : '#ffffff',
    transform: isActivePath ? 'none' : 'translateX(4px)'
  },
});

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showMarquee, setShowMarquee] = useState(() => localStorage.getItem('hideMarquee') !== 'true');
  const { user, tenant, roles, sites, activeSite, activeSiteId, setActiveSiteId, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleMenuItems = useMemo(() => {
    return menuItems.map(item => {
      if (item.platformOnly && !user?.is_platform_admin) return null;
      if (item.text === 'SaaS Admin') return item;

      if (item.children) {
        const visibleChildren = item.children.filter(child => hasPermission(child.resource, 'can_read'));
        if (visibleChildren.length === 0) return null;
        return { ...item, children: visibleChildren };
      } else {
        if (item.resource && !hasPermission(item.resource, 'can_read')) return null;
        return item;
      }
    }).filter(Boolean);
  }, [user, hasPermission]);

  useEffect(() => {
    let interval;
    const fetchAlerts = () => {
      api.get('/api/alerts').then(r => {
        const data = r.data;
        const unreadAlerts = data.filter(a => !a.is_read);
        const unresolvedAlerts = data.filter(a => !a.is_resolved);
        setAlertCount(unreadAlerts.length);
        setActiveAlerts(unresolvedAlerts);
      }).catch(() => { });
    };

    fetchAlerts();
    interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (visibleMenuItems && visibleMenuItems.length <= 3) {
      const autoExpandedMenus = {};
      visibleMenuItems.forEach(item => {
        if (item.children) {
          autoExpandedMenus[item.text] = true;
        }
      });
      setOpenMenus(prev => ({ ...prev, ...autoExpandedMenus }));
    }
  }, [visibleMenuItems]);

  const handleToggleMarquee = () => {
    const newState = !showMarquee;
    setShowMarquee(newState);
    if (!newState) {
      localStorage.setItem('hideMarquee', 'true');
    } else {
      localStorage.removeItem('hideMarquee');
    }
  };

  const handleToggle = (text) => {
    setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) => {
    if (item.path && isActive(item.path)) return true;
    if (item.children && item.children.some(child => isActive(child.path))) return true;
    return false;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Logo Area */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src={logoImg}
            alt="Eastpoint"
            sx={{
              width: 36, height: 36, objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          />
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 800, 
            fontSize: '1rem', 
            lineHeight: 1.2, 
            whiteSpace: 'nowrap', 
            letterSpacing: '0.02em',
            background: 'linear-gradient(90deg, #60A5FA, #E2E8F0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
          }}>
            Eastpoint Smart Campus
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto', color: '#94A3B8', p: 0.5 }}>
              <ChevronLeft />
            </IconButton>
          )}
        </Box>
        <Typography variant="caption" sx={{ 
          color: '#CBD5E1', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          display: 'block', 
          lineHeight: 1.2, 
          mt: 1, 
          textAlign: 'left', 
          letterSpacing: '0.02em' 
        }}>
          Enterprise Materials Governance Platform
        </Typography>
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
                    color: isParentActive(item) ? '#fff' : '#94A3B8',
                    background: isParentActive(item) ? 'linear-gradient(90deg, rgba(37,99,235,0.3), rgba(37,99,235,0.1))' : 'transparent',
                    borderLeft: isParentActive(item) ? '3px solid #2563EB' : '3px solid transparent',
                    '&:hover': {
                      background: 'rgba(37,99,235,0.1)',
                      color: '#E2E8F0',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ color: isParentActive(item) ? '#60A5FA' : '#64748B', minWidth: 36, '& svg': { fontSize: '1.2rem' } }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ sx: { fontSize: '0.82rem', fontWeight: isParentActive(item) ? 600 : 400 } }} />
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
                          sx={getSubmoduleStyle(isActive(child.path))}
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


      {/* Attribution */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
        <Box component="img" src="/nissigrid_logo.jpg" sx={{ height: 32, objectFit: 'contain', opacity: 0.9 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.75rem', lineHeight: 1.2 }}>
            Powered by
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.2 }}>
            NissiGrid Technologies
          </Typography>
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
          <Toolbar variant="dense" sx={{ gap: 1, minHeight: { xs: 48, sm: 48, md: 48 }, '&.MuiToolbar-root': { minHeight: 48 } }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#334155', py: 0.5 }}>
                <MenuIcon />
              </IconButton>
            )}

            {activeAlerts.length > 0 && (
              <Tooltip title={showMarquee ? "Hide Alerts Banner" : "Show Alerts Banner"}>
                <IconButton onClick={handleToggleMarquee} sx={{ 
                  color: showMarquee ? '#EF4444' : '#94A3B8',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: '#F1F5F9' },
                  transition: 'all 0.2s',
                  mr: 1
                }}>
                  <Campaign />
                </IconButton>
              </Tooltip>
            )}

            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', alignSelf: 'stretch' }}>
              {activeAlerts.length > 0 && showMarquee && (
                <Box sx={{
                  width: '100%',
                  bgcolor: 'transparent',
                  color: '#991B1B',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}>
                  <Box sx={{
                    display: 'flex',
                    width: 'max-content',
                    paddingLeft: '100%',
                    animation: `marqueeStandard ${Math.max(20, activeAlerts.length * 15)}s linear infinite`,
                    '@keyframes marqueeStandard': {
                      '0%': { transform: 'translateX(0)' },
                      '100%': { transform: 'translateX(-100%)' }
                    },
                    '&:hover': {
                      animationPlayState: 'paused'
                    }
                  }}>
                    {activeAlerts.map((alert, index) => (
                      <Box key={alert.id} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, pr: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>⚠️ {alert.title}:</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{alert.message}</Typography>
                        {(alert.reference_type === 'Indent' || alert.reference_type === 'PurchaseOrder' || alert.reference_type === 'PurchaseRequest' || alert.reference_type === 'GateEntry') && (
                          <Button 
                            size="small"
                            variant="contained"
                            sx={{ 
                              minWidth: 0, 
                              py: 0.2, 
                              px: 1.5, 
                              ml: 2, 
                              fontWeight: 800, 
                              bgcolor: '#EF4444', 
                              color: '#fff',
                              borderRadius: 8,
                              whiteSpace: 'nowrap',
                              textTransform: 'none',
                              fontSize: '0.65rem',
                              boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
                              '&:hover': { 
                                bgcolor: '#DC2626',
                                boxShadow: '0 4px 6px rgba(239,68,68,0.5)',
                              } 
                            }}
                            onClick={() => {
                              api.put(`/api/alerts/${alert.id}/read`).catch(() => {});
                              if (alert.reference_type === 'Indent') {
                                navigate('/indents', { state: { openIndentId: alert.reference_id } });
                              } else if (alert.reference_type === 'PurchaseOrder') {
                                navigate('/purchase-orders', { state: { openPOId: alert.reference_id } });
                              } else if (alert.reference_type === 'PurchaseRequest') {
                                navigate('/purchase-requests', { state: { openPRId: alert.reference_id } });
                              } else if (alert.reference_type === 'GateEntry') {
                                navigate('/grn');
                              }
                            }}
                          >
                            Review Now
                          </Button>
                        )}
                        {index < activeAlerts.length - 1 && <Box component="span" sx={{ ml: 4, color: '#FCA5A5' }}>•</Box>}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            <Tooltip title="Notifications">
              <IconButton onClick={() => navigate('/alerts')} sx={{ color: '#64748B' }}>
                <Badge badgeContent={alertCount} color="error" max={99}>
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                cursor: 'pointer', 
                p: 0.5, 
                borderRadius: 1, 
                '&:hover': { bgcolor: '#F1F5F9' } 
              }}
            >
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
                {user?.full_name?.charAt(0)}
              </Avatar>
              {!isMobile && (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                  {user?.full_name}
                </Typography>
              )}
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
              PaperProps={{ sx: { mt: 1, minWidth: 180 } }}>
              <MenuItem disabled sx={{ opacity: '1 !important', color: '#1E293B', pb: 0.5 }}>
                <Person sx={{ mr: 1, fontSize: 20, color: '#64748B' }} /> 
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {user?.username || user?.full_name}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem disabled sx={{ pt: 0, minHeight: 'auto', opacity: '1 !important' }}>
                <Typography variant="caption" sx={{ color: '#64748B', pl: 3.5 }}>
                  {user?.tenant_name || 'Platform Admin'}
                </Typography>
              </MenuItem>
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
