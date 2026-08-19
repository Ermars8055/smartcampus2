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
  AccountBalance, Campaign, RemoveCircleOutline, Insights
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logoImg from '../assets/Eastpoint-White-Logo.png';

const DRAWER_WIDTH = 260;

const ALL_ICONS = {
  MenuIcon, Dashboard, Inventory2, ShoppingCart, Warehouse,
  LocalShipping, People, Assessment, Settings, Notifications,
  ExpandLess, ExpandMore, Logout, Person, Store, Assignment,
  SwapHoriz, Undo, Security, ReceiptLong, AccountTree, Category,
  Build, ChevronLeft, RequestQuote, Business, AssignmentTurnedIn, Straighten,
  AccountBalance, Campaign, RemoveCircleOutline, Insights
};

const resolveIcon = (iconName) => {
  if (!iconName) return <Category />;
  const IconComponent = ALL_ICONS[iconName];
  return IconComponent ? <IconComponent /> : <Category />;
};

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const getSubmoduleStyle = (isActivePath) => ({
  borderRadius: 0,
  borderLeft: isActivePath ? '3px solid #60A5FA' : '3px solid transparent',
  py: 0.6,
  pl: isActivePath ? 4.5 : 5,
  color: isActivePath ? '#60A5FA' : '#CBD5E1',
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
  const [menuItems, setMenuItems] = useState([]);
  const { user, tenant, roles, sites, activeSite, activeSiteId, setActiveSiteId, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('/api/menus').then((res) => {
      setMenuItems(res.data);
    }).catch(err => {
      console.error("Failed to fetch menus", err);
    });
  }, []);

  const visibleMenuItems = useMemo(() => {
    return menuItems.map(item => {
      if (item.platform_only && !user?.is_platform_admin) return null;
      if (item.text === 'SaaS Admin') return item;

      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children.filter(child => !child.resource || hasPermission(child.resource, 'can_read'));
        if (visibleChildren.length === 0) return null;
        return { ...item, children: visibleChildren };
      } else {
        if (item.resource && !hasPermission(item.resource, 'can_read')) return null;
        return item;
      }
    }).filter(Boolean);
  }, [user, hasPermission, menuItems]);

  useEffect(() => {
    let interval;
    const fetchAlerts = () => {
      api.get(`/api/alerts?_t=${new Date().getTime()}`).then(r => {
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
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ position: 'absolute', right: 8, top: 8, color: '#94A3B8', p: 0.5 }}>
            <ChevronLeft />
          </IconButton>
        )}
        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src={logoImg}
              alt="Eastpoint"
              sx={{
                width: 48, height: 48, objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 800, 
              fontSize: '1.15rem', 
              lineHeight: 1.1, 
              letterSpacing: '0.02em',
              background: 'linear-gradient(90deg, #60A5FA, #E2E8F0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }}>
              Eastpoint<br/>SmartCampus
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ 
            color: '#CBD5E1', 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            display: 'block', 
            lineHeight: 1.2, 
            mt: 0.5, 
            letterSpacing: '0.02em',
            textAlign: 'center'
          }}>
            Material Governance Platform
          </Typography>
        </Box>
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
                    color: isParentActive(item) ? '#fff' : '#CBD5E1',
                    background: isParentActive(item) ? 'linear-gradient(90deg, rgba(37,99,235,0.3), rgba(37,99,235,0.1))' : 'transparent',
                    borderLeft: isParentActive(item) ? '3px solid #2563EB' : '3px solid transparent',
                    '&:hover': {
                      background: 'rgba(37,99,235,0.1)',
                      color: '#F8FAFC',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{ color: isParentActive(item) ? '#60A5FA' : '#94A3B8', minWidth: 36, '& svg': { fontSize: '1.2rem' } }}>
                    {resolveIcon(item.icon_name)}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ sx: { fontSize: '0.82rem', fontWeight: isParentActive(item) ? 600 : 400 } }} />
                  {item.children && item.children.length > 0 && (openMenus[item.text] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />)}
                </ListItemButton>
              </ListItem>
              {item.children && item.children.length > 0 && (
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
        <Box component="img" src="/NissiGrid-Logo.png" sx={{ height: 48, objectFit: 'contain', opacity: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" sx={{ color: '#FFFFFF', fontSize: '0.75rem', lineHeight: 1.2, fontStyle: 'oblique' }}>
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
          sx={{ '@media print': { display: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', backgroundColor: '#0F172A', borderRadius: 0 } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="permanent"
          sx={{ '@media print': { display: 'none' }, width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', backgroundColor: '#0F172A', borderRadius: 0 } }}>
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
                      <Box key={alert.id} component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, pr: 6, color: alert.severity === 'Success' ? '#15803d' : 'inherit' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{alert.severity === 'Success' ? '✅' : '⚠️'} {alert.title}:</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{alert.message}</Typography>
                        {(alert.reference_type === 'Indent' || alert.reference_type === 'PurchaseOrder' || alert.reference_type === 'PurchaseRequest' || alert.reference_type === 'GateEntry' || alert.reference_type === 'IndentApproved' || alert.reference_type === 'IndentIssued' || alert.reference_type === 'Vendor') && (
                          <Button 
                            size="small"
                            variant="contained"
                            sx={{ 
                              minWidth: 0, 
                              py: 0.2, 
                              px: 1.5, 
                              ml: 2, 
                              fontWeight: 800, 
                              bgcolor: alert.severity === 'Success' ? '#22c55e' : '#EF4444', 
                              color: '#fff',
                              borderRadius: 8,
                              whiteSpace: 'nowrap',
                              textTransform: 'none',
                              fontSize: '0.65rem',
                              boxShadow: alert.severity === 'Success' ? '0 2px 4px rgba(34,197,94,0.4)' : '0 2px 4px rgba(239,68,68,0.4)',
                              '&:hover': { 
                                bgcolor: alert.severity === 'Success' ? '#16a34a' : '#DC2626',
                                boxShadow: alert.severity === 'Success' ? '0 4px 6px rgba(34,197,94,0.5)' : '0 4px 6px rgba(239,68,68,0.5)',
                              } 
                            }}
                            onClick={() => {
                              const isIndenterAlert = alert.reference_type === 'IndentApproved' || alert.reference_type === 'IndentIssued';
                              
                              if (isIndenterAlert) {
                                api.put(`/api/alerts/${alert.id}/resolve`).catch(() => {});
                                setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
                                setAlertCount(prev => Math.max(0, prev - 1));
                              } else {
                                api.put(`/api/alerts/${alert.id}/read`).catch(() => {});
                              }
                              
                              if (alert.reference_type === 'Indent' || alert.reference_type === 'IndentApproved') {
                                navigate('/indents', { state: { openIndentId: alert.reference_id } });
                              } else if (alert.reference_type === 'IndentIssued') {
                                navigate('/pending-acknowledgments');
                              } else if (alert.reference_type === 'PurchaseOrder') {
                                navigate('/purchase-orders', { state: { openPOId: alert.reference_id } });
                              } else if (alert.reference_type === 'PurchaseRequest') {
                                navigate('/purchase-requests', { state: { openPRId: alert.reference_id } });
                              } else if (alert.reference_type === 'GateEntry') {
                                navigate('/grn');
                              } else if (alert.reference_type === 'Vendor') {
                                navigate('/vendors');
                              }
                            }}
                          >
                            {(alert.reference_type === 'IndentApproved' || alert.reference_type === 'IndentIssued') ? 'View' : 'Review Now'}
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
