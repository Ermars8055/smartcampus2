import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, Chip
} from '@mui/material';
import { Build, Warning } from '@mui/icons-material';
import api from '../services/api';

export default function Repair() {
  const [returnItems, setReturnItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const retRes = await api.get('/api/returns');
        const items = [];
        retRes.data.forEach(ret => {
          if (ret.items) {
            ret.items.forEach(item => {
              items.push({
                ...item,
                return_number: ret.return_number,
                created_at: ret.created_at,
                project_name: ret.project_name,
                warehouse_name: ret.warehouse_name,
              });
            });
          }
        });
        // Sort by newest first
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setReturnItems(items);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: '#FFFBEB', borderRadius: 2, color: '#D97706', display: 'flex' }}>
            <Build fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Repair</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>View all returned items that may require maintenance or repair.</Typography>
          </Box>
        </Box>
      </Box>

      {returnItems.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <Warning sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Return Items Found</Typography>
          <Typography variant="body2" color="textSecondary">All return items will be listed here.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Table aria-label="repair items table">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>RETURN NO.</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>MATERIAL</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>QTY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>FROM PROJECT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>TO WAREHOUSE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>REMARKS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnItems.map((item, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ color: '#64748B' }}>{formatDate(item.created_at)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{item.return_number}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.material_name}</TableCell>
                  <TableCell>{item.returned_qty} {item.uom_name}</TableCell>
                  <TableCell sx={{ color: '#64748B' }}>{item.project_name}</TableCell>
                  <TableCell sx={{ color: '#64748B' }}>{item.warehouse_name}</TableCell>
                  <TableCell sx={{ color: '#64748B' }}>{item.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
