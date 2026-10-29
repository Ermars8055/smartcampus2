import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Card, Button, TextField, Grid, Checkbox, IconButton,
  Chip, Tooltip, Divider, Collapse, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, CircularProgress, Alert
} from '@mui/material';
import {
  ArrowBack, Save, ExpandLess, ExpandMore, Add, Delete,
  CheckBoxOutlineBlank, CheckBox as CheckBoxIcon, Security,
  Dashboard, Category, ShoppingCart, Store, Warehouse, Assessment,
  Build, Settings, IndeterminateCheckBox
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Modules will be fetched dynamically

const ALL_ACTIONS = ['read', 'create', 'update', 'delete'];
const ACTION_LABELS = { read: 'View', create: 'Create', update: 'Edit', delete: 'Delete' };
const ACTION_COLORS = { read: '#10B981', create: '#3B82F6', update: '#F59E0B', delete: '#EF4444' };

const DOCUMENT_TYPES = [
  { value: 'INDENT', label: 'Indent' },
  { value: 'PURCHASE_REQUEST', label: 'Purchase Request' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'WRITE_OFF', label: 'Write Off' },
  { value: 'CreditNote', label: 'Credit Note' },
];

// ── Helper: Build a flat map of resource → { can_read, can_create, ... } ──
function buildPermMap(permissions = []) {
  const map = {};
  permissions.forEach((p) => {
    map[p.resource] = {
      can_read: p.can_read,
      can_create: p.can_create,
      can_update: p.can_update,
      can_delete: p.can_delete,
      extended_actions: p.extended_actions || {},
    };
  });
  return map;
}

// ── Helper: Convert permMap back to API payload ─────────────────────────
function permMapToArray(permMap) {
  return Object.entries(permMap)
    .filter(([_, perms]) => {
      // Keep if any CRUD action is true OR any extended action is true
      const hasCrud = [perms.can_read, perms.can_create, perms.can_update, perms.can_delete].some(Boolean);
      const hasExtended = Object.values(perms.extended_actions || {}).some(Boolean);
      return hasCrud || hasExtended;
    })
    .map(([resource, perms]) => ({ resource, ...perms }));
}

export default function RoleConfiguration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditing = Boolean(id);

  // ── State ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [dataAccessScope, setDataAccessScope] = useState('Self Only');
  const [permMap, setPermMap] = useState({});
  const [workflowRules, setWorkflowRules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [moduleTree, setModuleTree] = useState([]);

  // Fetch menus and role
  useEffect(() => {
    setLoading(true);
    // Fetch menus first to build the dynamic module tree
    api.get('/api/menus')
      .then(res => {
        const menus = res.data;
        const dynamicTree = menus
          .filter(m => !m.platform_only) // Only show non-platform menus
          .map(m => {
            const children = (m.children || []).map(c => ({
              label: c.text,
              resource: c.resource,
              actions: c.basic_actions && c.basic_actions.length > 0 ? c.basic_actions : ['read', 'create', 'update', 'delete'],
              extendedActions: c.extended_actions || []
            })).filter(c => c.resource); // Only keep children that have a resource

            // If a parent has a resource but no children, treat it as its own child
            if (m.resource && children.length === 0) {
              children.push({
                label: m.text,
                resource: m.resource,
                actions: m.basic_actions && m.basic_actions.length > 0 ? m.basic_actions : ['read', 'create', 'update', 'delete'],
                extendedActions: m.extended_actions || []
              });
            }

            return {
              module: m.text,
              icon: m.icon_name,
              children
            };
          }).filter(m => m.children.length > 0);
        
        setModuleTree(dynamicTree);
        setExpandedModules(Object.fromEntries(dynamicTree.map((m) => [m.module, true])));
        
        if (!isEditing) {
          setLoading(false);
        } else {
          return api.get(`/api/rbac/roles/${id}`);
        }
      })
      .then((r) => {
        if (!r) return;
        const data = r.data;
        setRoleName(data.name || '');
        setRoleCode(data.code || '');
        setRoleDescription(data.description || '');
        setDataAccessScope(data.data_access_scope || 'Self Only');
        setPermMap(buildPermMap(data.permissions || []));
        setWorkflowRules(
          (data.workflow_rules || []).map((w, i) => ({ ...w, _key: i }))
        );
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load role');
        setLoading(false);
      });
  }, [id, isEditing]);

  // ── Permission toggles ───────────────────────────────────────────────
  const togglePerm = (resource, action) => {
    setPermMap((prev) => {
      const key = `can_${action}`;
      const cur = prev[resource] || {};
      return { ...prev, [resource]: { ...cur, [key]: !cur[key] } };
    });
  };

  const toggleExtPerm = (resource, extKey) => {
    setPermMap((prev) => {
      const cur = prev[resource] || {};
      const ext = cur.extended_actions || {};
      return {
        ...prev,
        [resource]: { ...cur, extended_actions: { ...ext, [extKey]: !ext[extKey] } },
      };
    });
  };

  const isChecked = (resource, action) => {
    return !!permMap[resource]?.[`can_${action}`];
  };

  const isExtChecked = (resource, extKey) => {
    return !!permMap[resource]?.extended_actions?.[extKey];
  };

  // Module-level select-all for a specific action
  const getModuleActionState = (children, action) => {
    const applicableChildren = children.filter(
      (c) => !c.actions || c.actions.includes(action)
    );
    if (applicableChildren.length === 0) return 'none';
    const checked = applicableChildren.filter((c) => isChecked(c.resource, action));
    if (checked.length === 0) return 'none';
    if (checked.length === applicableChildren.length) return 'all';
    return 'some';
  };

  const toggleModuleAction = (children, action) => {
    const state = getModuleActionState(children, action);
    const newValue = state !== 'all';
    setPermMap((prev) => {
      const next = { ...prev };
      children.forEach((c) => {
        if (c.actions && !c.actions.includes(action)) return;
        const key = `can_${action}`;
        next[c.resource] = { ...(next[c.resource] || {}), [key]: newValue };
      });
      return next;
    });
  };

  const toggleEntireModule = (children, enabled) => {
    setPermMap((prev) => {
      const next = { ...prev };
      children.forEach((c) => {
        if (enabled) {
          next[c.resource] = { ...(next[c.resource] || {}), can_read: true };
        } else {
          next[c.resource] = { 
            can_read: false, 
            can_create: false, 
            can_update: false, 
            can_delete: false, 
            extended_actions: {} 
          };
        }
      });
      return next;
    });
  };

  const toggleSubmodule = (resource, enabled) => {
    setPermMap((prev) => {
      const next = { ...prev };
      if (enabled) {
        next[resource] = { ...(next[resource] || {}), can_read: true };
      } else {
        next[resource] = {
          can_read: false,
          can_create: false,
          can_update: false,
          can_delete: false,
          extended_actions: {}
        };
      }
      return next;
    });
  };

  // Global select-all / revoke-all
  const grantAll = () => {
    const next = {};
    moduleTree.forEach((mod) =>
      mod.children.forEach((c) => {
        const actions = c.actions || ALL_ACTIONS;
        const perms = { extended_actions: {} };
        actions.forEach((a) => (perms[`can_${a}`] = true));
        ALL_ACTIONS.forEach((a) => {
          if (!perms[`can_${a}`]) perms[`can_${a}`] = false;
        });
        // Also grant all extended actions if present
        if (c.extendedActions) {
          c.extendedActions.forEach((ext) => {
            perms.extended_actions[ext.key] = true;
          });
        }
        next[c.resource] = { ...(next[c.resource] || {}), ...perms };
      })
    );
    setPermMap(next);
  };

  const revokeAll = () => setPermMap({});

  // ── Workflow rules ────────────────────────────────────────────────────
  const addWorkflowRule = () => {
    setWorkflowRules((prev) => [
      ...prev,
      { _key: Date.now(), document_type: 'INDENT', level: 1, min_amount: 0, max_amount: null, is_active: true },
    ]);
  };

  const updateWorkflowRule = (idx, field, value) => {
    setWorkflowRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const removeWorkflowRule = (idx) => {
    setWorkflowRules((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!roleName.trim() || !roleCode.trim()) {
      setError('Role Name and Code are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      name: roleName.trim(),
      code: roleCode.trim().toUpperCase(),
      description: roleDescription.trim() || null,
      data_access_scope: dataAccessScope,
      permissions: permMapToArray(permMap),
      workflow_rules: workflowRules.map(({ _key, id: _id, ...rest }) => ({
        ...rest,
        level: Number(rest.level) || 1,
        min_amount: Number(rest.min_amount) || 0,
        max_amount: rest.max_amount ? Number(rest.max_amount) : null,
        user_id: rest.user_id || null,
      })),
    };

    try {
      if (isEditing) {
        await api.put(`/api/rbac/roles/${id}`, payload);
      } else {
        await api.post('/api/rbac/roles', payload);
      }
      navigate('/admin/roles');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save role configuration.');
    } finally {
      setSaving(false);
    }
  };

  // ── Expand / collapse ─────────────────────────────────────────────────
  const toggleExpand = (module) => {
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  // ── Count total granted permissions ───────────────────────────────────
  const totalGranted = useMemo(() => {
    let count = 0;
    Object.values(permMap).forEach((perms) => {
      // Count CRUD
      ['can_read', 'can_create', 'can_update', 'can_delete'].forEach(k => {
        if (perms[k]) count++;
      });
      // Count extended actions
      if (perms.extended_actions) {
        Object.values(perms.extended_actions).forEach(v => {
          if (v) count++;
        });
      }
    });
    return count;
  }, [permMap]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/admin/roles')} sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {isEditing ? 'Edit Role Configuration' : 'Create New Role'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Define role identity, module permissions, and workflow participation
          </Typography>
        </Box>
        <Chip
          label={`${totalGranted} permissions granted`}
          sx={{ fontWeight: 600, bgcolor: totalGranted > 0 ? '#DCFCE7' : '#F1F5F9', color: totalGranted > 0 ? '#166534' : '#64748B' }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* ── Section A: Role Identity ───────────────────────────────────── */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
            <Security />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Role Identity
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth label="Role Name" value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required placeholder="e.g. Store Keeper"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth label="Role Code" value={roleCode}
              onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
              required disabled={isEditing}
              placeholder="e.g. STORE_KEEPER" size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Data Access Scope</InputLabel>
              <Select
                value={dataAccessScope}
                label="Data Access Scope"
                onChange={(e) => setDataAccessScope(e.target.value)}
              >
                <MenuItem value="Self Only">Self Only</MenuItem>
                <MenuItem value="Department">Department</MenuItem>
                <MenuItem value="Institution">Institution</MenuItem>
                <MenuItem value="Organization">Organization</MenuItem>
                <MenuItem value="Full Administrative Access">Full Administrative Access</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth label="Description" value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Brief description of this role" size="small"
            />
          </Grid>
        </Grid>
      </Card>

      {/* ── Section B: Module Access Matrix ─────────────────────────────── */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: 2, color: '#16A34A', display: 'flex' }}>
              <CheckBoxIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Module Access Permissions
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Configure view, create, edit and delete access for each module
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" color="success" onClick={grantAll}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 2 }}>
              Grant All
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={revokeAll}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 2 }}>
              Revoke All
            </Button>
          </Box>
        </Box>

        <TableContainer 
          sx={{ 
            maxHeight: '60vh', 
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 6, height: 6 },
            '&::-webkit-scrollbar-track': { backgroundColor: '#F1F5F9' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: 3, '&:hover': { backgroundColor: '#94A3B8' } }
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem', width: '40%', pl: 3 }}>
                  Module / Sub-Module
                </TableCell>
                {ALL_ACTIONS.map((action) => (
                  <TableCell key={action} align="center"
                    sx={{ fontWeight: 700, fontSize: '0.75rem', color: ACTION_COLORS[action], width: '15%' }}>
                    {ACTION_LABELS[action]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {moduleTree.map((mod) => (
                <ModuleGroup
                  key={mod.module}
                  mod={mod}
                  expanded={expandedModules[mod.module]}
                  onToggleExpand={() => toggleExpand(mod.module)}
                  isChecked={isChecked}
                  togglePerm={togglePerm}
                  isExtChecked={isExtChecked}
                  toggleExtPerm={toggleExtPerm}
                  getModuleActionState={getModuleActionState}
                  toggleModuleAction={toggleModuleAction}
                  toggleEntireModule={toggleEntireModule}
                  toggleSubmodule={toggleSubmodule}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Section C: Workflow Participation ───────────────────────────── */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#FEF3C7', borderRadius: 2, color: '#D97706', display: 'flex' }}>
              <Settings />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Workflow Participation
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Define if this role acts as an approver in document workflows
              </Typography>
            </Box>
          </Box>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={addWorkflowRule}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderRadius: 2 }}>
            Add Rule
          </Button>
        </Box>

        {workflowRules.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>
            <Typography variant="body2">
              No workflow rules configured. Click "Add Rule" to enable this role as an approver.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Document Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Approval Level</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Min Amount (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Max Amount (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Active</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {workflowRules.map((rule, idx) => (
                  <TableRow key={rule._key} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <Select value={rule.document_type}
                          onChange={(e) => updateWorkflowRule(idx, 'document_type', e.target.value)}>
                          {DOCUMENT_TYPES.map((dt) => (
                            <MenuItem key={dt.value} value={dt.value}>{dt.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <TextField size="small" type="number" value={rule.level}
                        onChange={(e) => updateWorkflowRule(idx, 'level', e.target.value)}
                        inputProps={{ min: 1, step: 1 }} sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <TextField size="small" type="number" value={rule.min_amount}
                        onChange={(e) => updateWorkflowRule(idx, 'min_amount', e.target.value)}
                        sx={{ width: 120 }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <TextField size="small" type="number" value={rule.max_amount || ''}
                        onChange={(e) => updateWorkflowRule(idx, 'max_amount', e.target.value || null)}
                        placeholder="No Limit" sx={{ width: 120 }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Switch size="small" checked={rule.is_active !== false}
                        onChange={(e) => updateWorkflowRule(idx, 'is_active', e.target.checked)} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <IconButton size="small" color="error" onClick={() => removeWorkflowRule(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* ── Footer Actions ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/admin/roles')}
          sx={{ color: '#64748B', borderColor: '#CBD5E1', fontWeight: 600, textTransform: 'none', borderRadius: 2, px: 4 }}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleSave} disabled={saving}
          sx={{
            fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 4, py: 1.2,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #6D28D9)' },
          }}>
          {isEditing ? 'Update Role' : 'Create Role'}
        </Button>
      </Box>
    </Box>
  );
}


// ── Module Group Component (collapsible row group) ──────────────────────
function ModuleGroup({ mod, expanded, onToggleExpand, isChecked, togglePerm, isExtChecked, toggleExtPerm, getModuleActionState, toggleModuleAction, toggleEntireModule, toggleSubmodule }) {
  // Deduplicate children for header-level checkbox (Reports shares resource)
  const uniqueResources = [...new Map(mod.children.map(c => [c.resource, c])).values()];
  // Check if ANY permission is granted for ANY child in this module
  const isModuleEnabled = mod.children.some(c => {
    const hasBasic = ALL_ACTIONS.some(a => isChecked(c.resource, a));
    const hasExt = c.extendedActions ? c.extendedActions.some(ext => isExtChecked(c.resource, ext.key)) : false;
    return hasBasic || hasExt;
  });

  return (
    <>
      {/* Module header row */}
      <TableRow
        sx={{
          bgcolor: '#F1F5F9',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#E2E8F0' },
          transition: 'background 0.15s',
        }}
        onClick={onToggleExpand}
      >
        <TableCell sx={{ pl: 2, py: 1.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={isModuleEnabled ? "Disable Entire Module" : "Enable Entire Module"}>
              <Switch
                size="small"
                checked={isModuleEnabled}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleEntireModule(mod.children, e.target.checked);
                }}
                color="primary"
              />
            </Tooltip>
            {expanded ? <ExpandLess sx={{ fontSize: 18, color: '#64748B' }} /> : <ExpandMore sx={{ fontSize: 18, color: '#64748B' }} />}
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>
              {mod.module}
            </Typography>
            <Chip
              label={mod.children.length}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#E2E8F0', color: '#475569' }}
            />
          </Box>
        </TableCell>
        {ALL_ACTIONS.map((action) => {
          const state = getModuleActionState(mod.children, action);
          const hasApplicable = mod.children.some(c => !c.actions || c.actions.includes(action));
          if (!hasApplicable) return <TableCell key={action} align="center"><Box sx={{ color: '#CBD5E1' }}>—</Box></TableCell>;
          return (
            <TableCell key={action} align="center" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                size="small"
                checked={state === 'all'}
                indeterminate={state === 'some'}
                onChange={() => toggleModuleAction(mod.children, action)}
                sx={{
                  color: '#CBD5E1',
                  '&.Mui-checked': { color: ACTION_COLORS[action] },
                  '&.MuiCheckbox-indeterminate': { color: ACTION_COLORS[action] },
                }}
              />
            </TableCell>
          );
        })}
      </TableRow>

      {/* Child rows */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, border: 'none' }}>
          <Collapse in={expanded} timeout="auto">
            <Table size="small">
              <TableBody>
                {mod.children.map((child, idx) => {
                  const actions = child.actions || ALL_ACTIONS;
                  return (
                    <React.Fragment key={`${child.resource}-${idx}`}>
                      <TableRow
                        sx={{
                          bgcolor: idx % 2 === 0 ? '#fff' : '#FAFBFC',
                          '&:hover': { bgcolor: '#F0F9FF' },
                          transition: 'background 0.15s',
                        }}
                      >
                        <TableCell sx={{ pl: 6, py: 0.8, width: '40%', borderBottom: child.extendedActions ? 'none' : '1px solid #F1F5F9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {mod.children.length > 1 && (
                              <Tooltip title={ALL_ACTIONS.some(a => isChecked(child.resource, a)) || (child.extendedActions && child.extendedActions.some(ext => isExtChecked(child.resource, ext.key))) ? "Disable Submodule" : "Enable Submodule"}>
                                <Switch
                                  size="small"
                                  checked={ALL_ACTIONS.some(a => isChecked(child.resource, a)) || (child.extendedActions && child.extendedActions.some(ext => isExtChecked(child.resource, ext.key)))}
                                  onChange={(e) => {
                                    toggleSubmodule(child.resource, e.target.checked);
                                  }}
                                  color="primary"
                                />
                              </Tooltip>
                            )}
                            <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>
                              {child.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        {ALL_ACTIONS.map((action) => {
                          if (!actions.includes(action)) {
                            return (
                              <TableCell key={action} align="center" sx={{ width: '15%', borderBottom: child.extendedActions ? 'none' : '1px solid #F1F5F9' }}>
                                <Box sx={{ color: '#E2E8F0' }}>—</Box>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell key={action} align="center" sx={{ width: '15%', borderBottom: child.extendedActions ? 'none' : '1px solid #F1F5F9' }}>
                              <Checkbox
                                size="small"
                                checked={isChecked(child.resource, action)}
                                onChange={() => togglePerm(child.resource, action)}
                                sx={{
                                  color: '#CBD5E1',
                                  '&.Mui-checked': { color: ACTION_COLORS[action] },
                                }}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {child.extendedActions && child.extendedActions.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ pt: 0, pb: 1.5, pl: 6, pr: 2, borderBottom: '1px solid #F1F5F9' }}>
                            <Box sx={{ p: 1.8, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {child.resource === 'configurations' ? 'Configurations Module Permissions / Workflow Actions:' : 'Workflow Actions:'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                {child.extendedActions.map(ext => {
                                  const extChecked = isExtChecked(child.resource, ext.key);
                                  return (
                                    <FormControlLabel
                                      key={ext.key}
                                      control={
                                        <Checkbox
                                          size="small"
                                          checked={extChecked}
                                          onChange={() => toggleExtPerm(child.resource, ext.key)}
                                          sx={{
                                            color: '#94A3B8',
                                            '&.Mui-checked': { color: ext.color || '#2563EB' }
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: extChecked ? 600 : 400, color: extChecked ? '#1E293B' : '#475569' }}>
                                          {ext.label}
                                        </Typography>
                                      }
                                      sx={{ m: 0 }}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
