import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, TextField, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { Search, RemoveRedEye, Print } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { formatDate } from '../utils/dateUtils';
import { printRwo } from '../utils/rwoPrint';

export default function RepairWorkOrders() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const [rwos, setRwos] = useState([]);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');

  const load = () => {
    api.get('/api/rwos').then(r => {
      let data = [...r.data];
      if (search) {
        data = data.filter(rwo => 
          rwo.rwo_number.toLowerCase().includes(search.toLowerCase()) ||
          rwo.equipment_name?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setRwos(data);
    }).catch(err => {
      showMessage(err.response?.data?.detail || 'Error loading RWOs', 'Error', 'error');
    });
  };

  useEffect(() => {
    load();
  }, [search]);

  const filteredRwos = rwos.filter(r => tabValue === 'All' || r.status === tabValue);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Repair Work Orders (RWO)</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{rwos.length} total work orders</Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3, p: 2, pb: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TextField
          size="small"
          placeholder="Search RWO by Number or Equipment"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 350, mb: 2 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />,
            sx: { borderRadius: 2 }
          }}
        />
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          {['Assigned', 'In Progress', 'Completed', 'Closed', 'All'].map(s => {
            const count = s === 'All' ? rwos.length : rwos.filter(r => r.status === s).length;
            if (s !== 'All' && count === 0 && !['Assigned', 'In Progress'].includes(s)) return null;
            return (
              <Tab
                key={s}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s}
                    <Chip
                      label={count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: tabValue === s ? 'primary.main' : 'action.selected', color: tabValue === s ? 'white' : 'text.primary' }}
                    />
                  </Box>
                }
                value={s}
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
              />
            )
          })}
        </Tabs>
      </Card>

      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>RWO NO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>COMPLAINT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>EQUIPMENT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>VENDOR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>CREATED ON</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRwos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Typography variant="body2">No Repair Work Orders found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredRwos.map(rwo => (
                <TableRow
                  key={rwo.id}
                  hover
                  onClick={() => navigate(`/rwos/${rwo.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{rwo.rwo_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{rwo.complaint_docket || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{rwo.equipment_name || 'N/A'}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{rwo.equipment_code}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{rwo.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {formatDate(rwo.created_at)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rwo.status}
                      size="small"
                      sx={{
                        bgcolor: rwo.status === 'Closed' ? '#ECFDF5' : (rwo.status === 'Completed' ? '#DBEAFE' : (rwo.status === 'Assigned' ? '#FEF9C3' : '#F1F5F9')),
                        color: rwo.status === 'Closed' ? '#10B981' : (rwo.status === 'Completed' ? '#2563EB' : (rwo.status === 'Assigned' ? '#CA8A04' : '#64748B')),
                        fontWeight: 600, fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Print RWO">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); printRwo(rwo); }} sx={{ color: '#2563EB', mr: 0.5 }}>
                        <Print fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/rwos/${rwo.id}`); }} sx={{ color: '#64748B' }}>
                        <RemoveRedEye fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
