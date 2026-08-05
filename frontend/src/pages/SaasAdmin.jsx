import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, FormControl, Grid, InputLabel,
  MenuItem, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, Paper, Divider, Stack
} from '@mui/material';
import { AddBusiness, Refresh, Business, AccountBox, Email, VpnKey, Apartment, Subscriptions } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

const initialForm = {
  tenantName: '',
  subscriptionType: 'single_site',
  siteName: '',
  siteLocation: '',
  adminUsername: '',
  adminEmail: '',
  adminFullName: '',
  adminPassword: '',
};

export default function SaasAdmin() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTenantDetails, setSelectedTenantDetails] = useState(null);

  const loadTenants = async () => {
    const res = await api.get('/api/admin/saas/tenants');
    setTenants(res.data || []);
  };

  useEffect(() => {
    loadTenants().catch((err) => setError(err.response?.data?.detail || 'Unable to load tenants'));
  }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleProvision = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        tenant: {
          name: form.tenantName,
          subscription_type: form.subscriptionType,
          is_active: true,
        },
        site: {
          name: form.siteName,
          location: form.siteLocation,
          is_active: true,
        },
        admin: {
          username: form.adminUsername,
          email: form.adminEmail,
          full_name: form.adminFullName,
          password: form.adminPassword,
          role: 'Admin',
        },
      };
      const res = await api.post('/api/admin/saas/tenants/provision', payload);
      setSuccess(`Successfully provisioned ${res.data.tenant.name}. Admin login: ${res.data.login_hint.username}`);
      setForm(initialForm);
      await loadTenants();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to provision workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleTenantClick = async (tenantId) => {
    try {
      const res = await api.get(`/api/admin/saas/tenants/${tenantId}/details`);
      setSelectedTenantDetails(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load workspace details');
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, height: '100%', borderRadius: 3 }}>
      <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: `${color}15`, color: color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{title}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 0, md: 1 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            SaaS Control Center
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B', mt: 0.5 }}>
            Manage workspaces, subscriptions, and platform-level infrastructure.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={loadTenants} 
          startIcon={<Refresh />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Workspaces" value={tenants.length} icon={<Business />} color="#3B82F6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Subscriptions" value={tenants.filter(t => t.status === 'Active').length} icon={<Subscriptions />} color="#10B981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Multi-Site Tenants" value={tenants.filter(t => t.subscription_plan === 'multi_site').length} icon={<Apartment />} color="#8B5CF6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Avg. Growth" value="+12%" icon={<Refresh />} color="#F59E0B" />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      <Grid container spacing={4}>
        {/* Left Pane: Details or Provisioning Form */}
        {selectedTenantDetails ? (
          <Grid item xs={12} lg={5}>
            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Business sx={{ color: '#60A5FA' }} /> Workspace Details
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Review configuration and admin access.</Typography>
                </Box>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setSelectedTenantDetails(null)}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff' }, textTransform: 'none' }}
                >
                  Close
                </Button>
              </Box>
              <Box sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Business fontSize="small" /> Workspace Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Company Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.tenant.name}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Subscription Tier</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                          {selectedTenantDetails.tenant.subscription_plan === 'multi_site' ? 'Enterprise (Multi Site)' : 'Professional (Single Site)'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Apartment fontSize="small" /> Primary Site Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Site Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.site.name}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Location</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.site.location || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBox fontSize="small" /> Admin Credentials
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Username</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.admin.username}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Password</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A', letterSpacing: 2 }}>••••••••</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Full Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.admin.full_name}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Email Address</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>{selectedTenantDetails.admin.email}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ) : (
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AddBusiness sx={{ color: '#60A5FA' }} /> Provision Workspace
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Onboard a new company with its first site and admin user.</Typography>
            </Box>
            <Box component="form" onSubmit={handleProvision} sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business fontSize="small" /> Workspace Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Company Name" value={form.tenantName} onChange={(e) => updateForm('tenantName', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Subscription Tier</InputLabel>
                        <Select label="Subscription Tier" value={form.subscriptionType} onChange={(e) => updateForm('subscriptionType', e.target.value)}>
                          <MenuItem value="single_site">Professional (Single Site)</MenuItem>
                          <MenuItem value="multi_site">Enterprise (Multi Site)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Apartment fontSize="small" /> Primary Site Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Site Name" value={form.siteName} onChange={(e) => updateForm('siteName', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Location" value={form.siteLocation} onChange={(e) => updateForm('siteLocation', e.target.value)} />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBox fontSize="small" /> Admin Credentials
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Username" value={form.adminUsername} onChange={(e) => updateForm('adminUsername', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Password" type="password" value={form.adminPassword} onChange={(e) => updateForm('adminPassword', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Full Name" value={form.adminFullName} onChange={(e) => updateForm('adminFullName', e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Email Address" type="email" value={form.adminEmail} onChange={(e) => updateForm('adminEmail', e.target.value)} required />
                    </Grid>
                  </Grid>
                </Box>

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={saving}
                  sx={{ 
                    py: 1.5, 
                    borderRadius: 2, 
                    fontWeight: 700,
                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                    textTransform: 'none'
                  }}
                >
                  {saving ? 'Provisioning Platform...' : 'Deploy Workspace'}
                </Button>
              </Stack>
            </Box>
          </Card>
        </Grid>
        )}

        {/* Workspace List */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>Registered Workspaces</Typography>
              <Chip label={`${tenants.length} Total`} size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>Workspace</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>Subscription</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', backgroundColor: '#F8FAFC' }}>Onboarding Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow 
                      key={tenant.id} 
                      onClick={() => handleTenantClick(tenant.id)}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: selectedTenantDetails?.tenant?.id === tenant.id ? '#EFF6FF' : 'inherit',
                        '&:hover': { backgroundColor: selectedTenantDetails?.tenant?.id === tenant.id ? '#DBEAFE' : '#F8FAFC' } 
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Paper sx={{ p: 1, borderRadius: 2, display: 'flex', backgroundColor: '#F1F5F9' }}>
                            <Business fontSize="small" sx={{ color: '#475569' }} />
                          </Paper>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>{tenant.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>slug: {tenant.slug}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tenant.subscription_plan === 'multi_site' ? 'Enterprise' : 'Professional'} 
                          size="small" 
                          sx={{ 
                            fontWeight: 700, 
                            backgroundColor: tenant.subscription_plan === 'multi_site' ? '#EEF2FF' : '#F0FDF4',
                            color: tenant.subscription_plan === 'multi_site' ? '#4F46E5' : '#16A34A',
                            border: '1px solid transparent'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tenant.status === 'Active' ? '#10B981' : '#CBD5E1' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tenant.status === 'Active' ? '#065F46' : '#64748B' }}>
                            {tenant.status === 'Active' ? 'Online' : 'Suspended'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>{formatDate(tenant.created_at)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
