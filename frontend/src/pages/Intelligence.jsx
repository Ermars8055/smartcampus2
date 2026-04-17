import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD', '#3B82F6', '#1D4ED8', '#7C3AED', '#059669'];

export default function Intelligence() {
  const [consumption, setConsumption] = useState([]);
  const [costByBlock, setCostByBlock] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [topMaterials, setTopMaterials] = useState([]);

  useEffect(() => {
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/blocks').then(r => setBlocks(r.data));
  }, []);

  useEffect(() => {
    const params = projectId ? { project_id: projectId } : {};
    api.get('/api/reports/consumption', { params }).then(r => {
      const data = r.data;
      setConsumption(data);
      // Group by block
      const blockMap = {};
      data.forEach(d => {
        if (!blockMap[d.block_name]) blockMap[d.block_name] = 0;
        blockMap[d.block_name] += d.total_value;
      });
      // Group by material
      const matMap = {};
      data.forEach(d => {
        if (!matMap[d.material_name]) matMap[d.material_name] = { qty: 0, value: 0 };
        matMap[d.material_name].qty += d.total_quantity;
        matMap[d.material_name].value += d.total_value;
      });
      setTopMaterials(Object.entries(matMap).map(([name, v]) => ({ material_name: name, quantity: v.qty, value: v.value })).sort((a, b) => b.value - a.value));
    });
    api.get('/api/dashboard/material-cost-by-block').then(r => setCostByBlock(r.data));
  }, [projectId]);

  // Build block summary
  const blockSummary = {};
  consumption.forEach(d => {
    if (!blockSummary[d.block_name]) blockSummary[d.block_name] = { total: 0, materials: [] };
    blockSummary[d.block_name].total += d.total_value;
    blockSummary[d.block_name].materials.push(d);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Project Material Intelligence</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Material usage analytics for project management</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Project</InputLabel>
          <Select value={projectId} label="Project" onChange={e => setProjectId(e.target.value)}>
            <MenuItem value="">All Projects</MenuItem>
            {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Material Cost by Block</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={costByBlock} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="block_name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="total_cost" name="Cost (₹)" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Cost Distribution</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={Object.entries(blockSummary).map(([name, v]) => ({ name, value: Math.round(v.total) }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {Object.keys(blockSummary).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Block-wise material breakdown */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {Object.entries(blockSummary).slice(0, 6).map(([blockName, data]) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={blockName}>
            <Card sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{blockName}</Typography>
                <Chip label={`₹${data.total.toLocaleString()}`} size="small" color="primary" sx={{ fontWeight: 600 }} />
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ py: 0.5 }}>Material</TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>Qty</TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>Value</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {data.materials.sort((a, b) => b.total_value - a.total_value).slice(0, 5).map((m, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: '0.78rem', py: 0.5 }}>{m.material_name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.78rem', py: 0.5 }}>{m.total_quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 0.5 }}>₹{m.total_value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Top consumed materials */}
      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Top Consumed Materials (by Value)</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>#</TableCell><TableCell>Material</TableCell>
              <TableCell align="right">Total Quantity</TableCell><TableCell align="right">Total Value (₹)</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {topMaterials.slice(0, 15).map((m, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{m.material_name}</TableCell>
                  <TableCell align="right">{m.quantity.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#1E3A8A' }}>₹{m.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
