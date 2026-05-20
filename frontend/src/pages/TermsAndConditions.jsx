import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Switch, FormControlLabel, Chip
} from '@mui/material';
import { Add, Edit, Delete, Close, Assignment } from '@mui/icons-material';
import api from '../services/api';

export default function TermsAndConditions() {
  const [terms, setTerms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', content: '', is_default: false });

  const loadTerms = async () => {
    try {
      const res = await api.get('/api/terms');
      setTerms(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const openModal = (term = null) => {
    if (term) {
      setEditingId(term.id);
      setForm({ name: term.name, content: term.content, is_default: term.is_default });
    } else {
      setEditingId(null);
      setForm({ name: '', content: '', is_default: false });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/api/terms/${editingId}`, form);
      } else {
        await api.post('/api/terms', form);
      }
      setModalOpen(false);
      loadTerms();
    } catch (e) {
      alert('Error saving terms and conditions');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/api/terms/${id}`);
      loadTerms();
    } catch (e) {
      alert('Error deleting template');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
            <Assignment />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Terms & Conditions</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Manage reusable PO terms and conditions templates</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openModal()}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          Add Template
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>TEMPLATE NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {terms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                    No terms and conditions templates found.
                  </TableCell>
                </TableRow>
              ) : (
                terms.map((term) => (
                  <TableRow key={term.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {term.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                        {term.content.length > 100 ? term.content.substring(0, 100) + '...' : term.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {term.is_default && (
                        <Chip label="Default" size="small" color="primary" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => openModal(term)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(term.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingId ? 'Edit Template' : 'New Template'}
            </Typography>
            <IconButton size="small" onClick={() => setModalOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Template Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Standard IT Hardware Terms"
            />
            <TextField
              label="Terms and Conditions Content"
              fullWidth
              multiline
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Enter terms and conditions, separated by newlines..."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                />
              }
              label="Set as Default Template"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#2563EB', textTransform: 'none' }}
          >
            Save Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
