import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, IconButton, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Switch, Chip, Tooltip, Collapse
} from '@mui/material';
import {
  Add, Edit, Delete, KeyboardArrowUp, KeyboardArrowDown,
  ExpandMore, ExpandLess, Settings, Save, CheckCircle
} from '@mui/icons-material';
import api from '../../services/api';

export default function MenuSettings() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    text: '',
    icon_name: '',
    path: '',
    resource: '',
    parent_id: '',
    platform_only: false,
    basic_actions: ['read', 'create', 'update', 'delete'],
    extended_actions: []
  });

  const fetchMenus = () => {
    setLoading(true);
    api.get('/api/menus')
      .then(res => {
        setMenus(res.data);
        const newExpanded = { ...expanded };
        res.data.forEach(m => {
          if (newExpanded[m.id] === undefined) newExpanded[m.id] = true;
        });
        setExpanded(newExpanded);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleToggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenDialog = (menu = null, parentId = null) => {
    if (menu) {
      setEditingMenu(menu);
      setFormData({
        text: menu.text || '',
        icon_name: menu.icon_name || '',
        path: menu.path || '',
        resource: menu.resource || '',
        parent_id: menu.parent_id || '',
        platform_only: menu.platform_only || false,
        basic_actions: menu.basic_actions || ['read', 'create', 'update', 'delete'],
        extended_actions: menu.extended_actions || []
      });
    } else {
      setEditingMenu(null);
      setFormData({
        text: '',
        icon_name: '',
        path: '',
        resource: '',
        parent_id: parentId || '',
        platform_only: false,
        basic_actions: ['read', 'create', 'update', 'delete'],
        extended_actions: []
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { ...formData };
    if (payload.parent_id === '') payload.parent_id = null;
    
    const request = editingMenu 
      ? api.put(`/api/menus/${editingMenu.id}`, payload)
      : api.post('/api/menus', payload);
      
    request.then(() => {
      setDialogOpen(false);
      fetchMenus();
    }).catch(err => console.error(err));
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this menu?")) {
      api.delete(`/api/menus/${id}`).then(() => fetchMenus());
    }
  };

  const handleMove = (id, direction) => {
    api.put(`/api/menus/${id}/move`, { direction }).then(() => fetchMenus());
  };

  const renderExtendedActions = (actions) => {
    if (!actions || actions.length === 0) return <Typography variant="caption" color="text.secondary">None</Typography>;
    return (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {actions.map((a, i) => (
          <Chip key={i} label={a.label || a.key} size="small" sx={{ bgcolor: a.color || '#E2E8F0', color: '#fff', fontSize: '0.65rem', height: 20 }} />
        ))}
      </Box>
    );
  };

  const addExtendedAction = () => {
    setFormData(prev => ({
      ...prev,
      extended_actions: [...prev.extended_actions, { key: '', label: '', color: '#3B82F6' }]
    }));
  };

  const updateExtendedAction = (index, field, value) => {
    const newActions = [...formData.extended_actions];
    newActions[index][field] = value;
    setFormData(prev => ({ ...prev, extended_actions: newActions }));
  };

  const removeExtendedAction = (index) => {
    setFormData(prev => ({
      ...prev,
      extended_actions: prev.extended_actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Menu Settings</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Manage application navigation and role configuration module structure</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Parent Menu
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, width: 50 }}></TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Label / Path</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Icon</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Resource / Actions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Platform Only</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'center' }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map((parent, pIndex) => (
                <React.Fragment key={parent.id}>
                  {/* Parent Row */}
                  <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                    <TableCell>
                      {parent.children?.length > 0 && (
                        <IconButton size="small" onClick={() => handleToggleExpand(parent.id)}>
                          {expanded[parent.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{parent.text}</Typography>
                      {parent.path && <Typography variant="caption" sx={{ color: '#64748B' }}>{parent.path}</Typography>}
                    </TableCell>
                    <TableCell>{parent.icon_name || '-'}</TableCell>
                    <TableCell>
                      {parent.resource && <Chip label={parent.resource} size="small" variant="outlined" sx={{ mb: 0.5 }} />}
                      {parent.resource && <Typography variant="caption" display="block">Basic: {parent.basic_actions?.join(', ')}</Typography>}
                    </TableCell>
                    <TableCell>
                      {parent.platform_only ? <Chip label="Yes" size="small" color="warning" /> : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <IconButton size="small" disabled={pIndex === 0} onClick={() => handleMove(parent.id, 'up')} sx={{ p: 0 }}><KeyboardArrowUp fontSize="small" /></IconButton>
                        <IconButton size="small" disabled={pIndex === menus.length - 1} onClick={() => handleMove(parent.id, 'down')} sx={{ p: 0 }}><KeyboardArrowDown fontSize="small" /></IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Add Submenu"><IconButton size="small" color="primary" onClick={() => handleOpenDialog(null, parent.id)}><Add fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpenDialog(parent)}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(parent.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Children Rows */}
                  {parent.children?.map((child, cIndex) => (
                    <TableRow key={child.id} sx={{ display: expanded[parent.id] ? 'table-row' : 'none' }}>
                      <TableCell></TableCell>
                      <TableCell sx={{ pl: 4 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{child.text}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>{child.path}</Typography>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {child.resource && <Chip label={child.resource} size="small" variant="outlined" sx={{ mb: 0.5, mr: 0.5 }} />}
                        <Typography variant="caption" display="block">Basic: {child.basic_actions?.join(', ')}</Typography>
                        {renderExtendedActions(child.extended_actions)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell align="center">
                         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <IconButton size="small" disabled={cIndex === 0} onClick={() => handleMove(child.id, 'up')} sx={{ p: 0 }}><KeyboardArrowUp fontSize="small" /></IconButton>
                          <IconButton size="small" disabled={cIndex === parent.children.length - 1} onClick={() => handleMove(child.id, 'down')} sx={{ p: 0 }}><KeyboardArrowDown fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleOpenDialog(child, parent.id)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(child.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingMenu ? 'Edit Menu' : 'Add Menu'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Menu Label" size="small" value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Path (Route)" size="small" value={formData.path} onChange={e => setFormData({...formData, path: e.target.value})} placeholder="/example" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Icon Name (e.g., Dashboard)" size="small" value={formData.icon_name} onChange={e => setFormData({...formData, icon_name: e.target.value})} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Resource Key (for Permissions)" size="small" value={formData.resource} onChange={e => setFormData({...formData, resource: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={formData.platform_only} onChange={e => setFormData({...formData, platform_only: e.target.checked})} />} label="SaaS Platform Admin Only" />
            </Grid>
            
            {/* Basic Actions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Basic Actions</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {['read', 'create', 'update', 'delete'].map(action => (
                  <FormControlLabel
                    key={action}
                    control={
                      <Switch size="small" 
                        checked={formData.basic_actions.includes(action)} 
                        onChange={e => {
                          if(e.target.checked) setFormData({...formData, basic_actions: [...formData.basic_actions, action]});
                          else setFormData({...formData, basic_actions: formData.basic_actions.filter(a => a !== action)});
                        }} 
                      />
                    }
                    label={action}
                  />
                ))}
              </Box>
            </Grid>

            {/* Extended Actions */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Extended Workflow Actions</Typography>
                <Button size="small" startIcon={<Add />} onClick={addExtendedAction}>Add Action</Button>
              </Box>
              {formData.extended_actions.map((action, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField size="small" label="Key (e.g. can_approve)" value={action.key} onChange={e => updateExtendedAction(idx, 'key', e.target.value)} sx={{ flex: 1 }} />
                  <TextField size="small" label="Label (e.g. Approve)" value={action.label} onChange={e => updateExtendedAction(idx, 'label', e.target.value)} sx={{ flex: 1 }} />
                  <TextField size="small" label="Color Hex" value={action.color} onChange={e => updateExtendedAction(idx, 'color', e.target.value)} sx={{ width: 120 }} />
                  <IconButton size="small" color="error" onClick={() => removeExtendedAction(idx)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
