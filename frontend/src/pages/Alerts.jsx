import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Chip, IconButton, Tooltip
} from '@mui/material';
import { CheckCircle, Circle } from '@mui/icons-material';
import api from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const load = () => { api.get('/api/alerts').then(r => setAlerts(r.data)); };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => { await api.put(`/api/alerts/${id}/read`); load(); };
  const resolve = async (id) => { await api.put(`/api/alerts/${id}/resolve`); load(); };

  const sevColor = { 'Critical': '#DC2626', 'Warning': '#D97706', 'Info': '#2563EB' };
  const sevBg = { 'Critical': '#FEF2F2', 'Warning': '#FFFBEB', 'Info': '#EFF6FF' };
  const sevBorder = { 'Critical': '#FECACA', 'Warning': '#FDE68A', 'Info': '#BFDBFE' };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Alerts & Notifications</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>{alerts.length} active alerts</Typography>
      </Box>

      {alerts.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#94A3B8' }}>🎉 No active alerts</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>All clear! Everything is running smoothly.</Typography>
        </Card>
      ) : (
        alerts.map(a => (
          <Card key={a.id} sx={{
            mb: 1.5, p: 2,
            background: a.is_read ? '#FAFAFA' : sevBg[a.severity],
            border: `1px solid ${a.is_read ? '#E2E8F0' : sevBorder[a.severity]}`,
            opacity: a.is_read ? 0.7 : 1,
            transition: 'all 0.3s',
            cursor: a.reference_type === 'Indent' ? 'pointer' : 'default',
            '&:hover': {
              boxShadow: a.reference_type === 'Indent' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
            }
          }}
          onClick={() => {
            if (a.reference_type === 'Indent') {
              if (!a.is_read) markRead(a.id);
              navigate('/indents', { state: { openIndentId: a.reference_id } });
            }
          }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Circle sx={{ fontSize: 10, mt: 0.8, color: sevColor[a.severity] }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</Typography>
                  <Chip label={a.severity} size="small" sx={{
                    background: sevColor[a.severity] + '20', color: sevColor[a.severity],
                    fontWeight: 600, fontSize: '0.65rem', height: 20
                  }} />
                  <Chip label={a.alert_type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 0.5 }}>{a.message}</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  {formatDateTime(a.created_at)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {!a.is_read && (
                  <Tooltip title="Mark as read">
                    <IconButton size="small" onClick={() => markRead(a.id)}>
                      <CheckCircle fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Resolve">
                  <IconButton size="small" color="success" onClick={() => resolve(a.id)}>
                    <CheckCircle fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Card>
        ))
      )}
    </Box>
  );
}
