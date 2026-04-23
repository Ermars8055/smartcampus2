import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import api from '../services/api';

const COLORS = ['#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD', '#3B82F6', '#1D4ED8', '#7C3AED', '#059669'];

export default function Intelligence() {
  const [consumption, setConsumption] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [period, setPeriod] = useState('all');
  const [topMaterials, setTopMaterials] = useState([]);

  // Utility to format currency consistently
  const formatCurrency = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  useEffect(() => {
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/blocks').then(r => setBlocks(r.data));
  }, []);

  useEffect(() => {
    let params = projectId ? { project_id: projectId } : {};
    
    if (period !== 'all') {
      const now = new Date();
      if (period === 'this_month') {
        params.start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (period === 'last_month') {
        params.start_date = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        params.end_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (period === 'ytd') {
        params.start_date = new Date(now.getFullYear(), 0, 1).toISOString();
      }
    }

    api.get('/api/intelligence/consumption', { params }).then(r => {
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
  }, [projectId, period]);

  // Build block summary
  const blockSummary = {};
  consumption.forEach(d => {
    if (!blockSummary[d.block_name]) blockSummary[d.block_name] = { total: 0, materials: [] };
    blockSummary[d.block_name].total += d.total_value;
    blockSummary[d.block_name].materials.push(d);
  });

  // Aggregate data for the bar chart
  const aggregatedBlockData = Object.entries(blockSummary)
    .map(([name, data]) => ({ block_name: name, total_cost: data.total }))
    .sort((a, b) => b.total_cost - a.total_cost);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Project Material Intelligence</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Material usage analytics for project management</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150, bgcolor: '#fff' }}>
            <InputLabel>Time Period</InputLabel>
            <Select value={period} label="Time Period" onChange={e => setPeriod(e.target.value)} sx={{ fontWeight: 600 }}>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="this_month">This Month</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="ytd">Year to Date (YTD)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff' }}>
            <InputLabel>Project</InputLabel>
            <Select value={projectId} label="Project" onChange={e => setProjectId(e.target.value)} sx={{ fontWeight: 600 }}>
              <MenuItem value="">All Projects</MenuItem>
              {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Material Cost by Block</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={aggregatedBlockData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="block_name" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} tickFormatter={formatCurrency} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Total Cost']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
                <Bar dataKey="total_cost" name="Cost (₹)" fill="#2563EB" radius={[6, 6, 0, 0]}>
                   <LabelList dataKey="total_cost" position="top" formatter={formatCurrency} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
                </Bar>
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
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500 }} />
                <Tooltip formatter={formatCurrency} contentStyle={{ borderRadius: 8 }} />
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
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>{blockName}</Typography>
                <Chip label={formatCurrency(data.total)} size="small" sx={{ fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }} />
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
                      <TableCell sx={{ fontSize: '0.78rem', py: 0.5, fontWeight: 500 }}>{m.material_name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.78rem', py: 0.5 }}>{m.total_quantity?.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.78rem', py: 0.5, color: '#334155' }}>₹{m.total_value.toLocaleString()}</TableCell>
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
                  <TableCell sx={{ fontWeight: 600, color: '#64748B' }}>{i + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{m.material_name}</TableCell>
                  <TableCell align="right">{m.quantity.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#2563EB' }}>₹{m.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
