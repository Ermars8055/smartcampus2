import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Skeleton
} from '@mui/material';
import {
  Inventory2, ShoppingCart, LocalShipping,
  Warning, Warehouse, Receipt
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, LabelList
} from 'recharts';
import api from '../services/api';

const COLORS = ['#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD', '#3B82F6', '#1D4ED8', '#DBEAFE', '#7C3AED'];

function StatCard({ title, value, icon, color, subtitle, onClick }) {
  return (
    <Card sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s',
      borderRadius: 2,
      border: 'none',
      borderBottom: `4px solid ${color}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      '&:hover': onClick ? { boxShadow: '0 4px 15px rgba(0,0,0,0.1)' } : {}
    }}
      onClick={onClick}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mt: 1, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ width: 44, height: 44, bgcolor: `${color}15`, color: color }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [consumption, setConsumption] = useState([]);
  const [stockByWh, setStockByWh] = useState([]);
  const [topMaterials, setTopMaterials] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/dashboard/consumption-by-block'),
      api.get('/api/dashboard/stock-by-warehouse'),
      api.get('/api/dashboard/top-consumed-materials'),
      api.get('/api/dashboard/recent-transactions'),
      api.get('/api/dashboard/alerts'),
      api.get('/api/dashboard/consumption-trend'),
    ]).then(([s, c, sw, tm, tx, al, tr]) => {
      setStats(s.data);
      setConsumption(c.data);
      setStockByWh(sw.data);
      setTopMaterials(tm.data);
      setRecentTx(tx.data);
      setAlerts(al.data);
      setTrend(tr.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={4} lg={2} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const formatCurrency = (v) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v}`;
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>Dashboard</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>Overview of materials, procurement, and inventory</Typography>
      </Box>

      {/* --- ROW 1: Stats Cards (6 in a row) --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Materials" value={stats?.total_materials || 0} icon={<Inventory2 />} color="#2563EB"
            subtitle="Active items" onClick={() => navigate('/materials')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Inventory Value" value={formatCurrency(stats?.total_inventory_value || 0)}
            icon={<Warehouse />} color="#059669" subtitle="Total stock value" onClick={() => navigate('/inventory')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Low Stock" value={stats?.low_stock_items || 0}
            icon={<Warning />} color="#DC2626" subtitle="Below reorder" onClick={() => navigate('/inventory?low=true')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Pending PR" value={stats?.pending_pr || 0}
            icon={<ShoppingCart />} color="#D97706" subtitle="Awaiting action" onClick={() => navigate('/purchase-requests')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Pending PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Open orders" onClick={() => navigate('/purchase-orders')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="GRN" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Total receipts" onClick={() => navigate('/grn')} />
        </Grid>
      </Grid>

      {/* --- ROW 2: Graphs Part 1 (8 / 4 Split as requested) --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: '#1E293B' }}>
              Material Consumption by Block
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={consumption} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="block_name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <RTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total_quantity" name="Quantity" fill="#60A5FA" radius={[4, 4, 0, 0]} maxBarSize={45}>
                  <LabelList dataKey="total_quantity" position="top" style={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                </Bar>
                <Bar dataKey="total_value" name="Value (₹)" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#1E293B' }}>
              Stock by Warehouse
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={stockByWh} cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                  dataKey="total_value" nameKey="warehouse_name" paddingAngle={2}>
                  {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <RTooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Value']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* --- ROW 3: Graphs Part 2 (6 / 6 Split as requested) --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: '#1E293B' }}>
              Top Consumed Materials
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: 20, right: 40, top: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="material_name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} axisLine={false} tickLine={false} />
                <RTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total_consumed" name="Total Units" fill="#1E3A8A" radius={[0, 4, 4, 0]} maxBarSize={20}>
                   <LabelList dataKey="total_consumed" position="right" style={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ p: 2.5, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: '#1E293B' }}>
              Consumption Trend
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trend} margin={{ right: 30, left: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="total" name="Issued Items" stroke="#2563EB" strokeWidth={3} dot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}>
                  <LabelList dataKey="total" position="top" offset={15} style={{ fontSize: 11, fill: '#2563EB', fontWeight: 700 }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* --- ROW 4: Log & Alerts (8 / 4 Split) --- */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B' }}>Recent Transactions</Typography>
              <Chip label="View All" size="small" sx={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#475569' }} onClick={() => navigate('/inventory')} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase' }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase' }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase' }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase' }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 1.5, textTransform: 'uppercase' }}>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTx.slice(0, 6).map((tx) => (
                    <TableRow key={tx.id} sx={{ '& td': { borderBottom: '1px solid #F8FAFC' }, '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{tx.material_name}</TableCell>
                      <TableCell>
                        <Chip label={tx.transaction_type} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, borderColor: '#E2E8F0', color: tx.quantity > 0 ? '#059669' : '#475569' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.85rem', color: tx.quantity > 0 ? '#059669' : '#DC2626' }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>{tx.warehouse_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>TRF-{tx.id.toString().padStart(6, '0')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', height: '100%' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B' }}>Active Alerts</Typography>
               <Chip label={`${alerts.length} Active`} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#FFF7ED', color: '#C2410C' }} />
            </Box>
            <Box sx={{ p: 2 }}>
              {alerts.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 4, fontWeight: 500 }}>System OK. No active alerts.</Typography>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                   <Box key={alert.id} sx={{
                    p: 2, mb: 1.5, borderRadius: 3,
                    bgcolor: alert.severity === 'Critical' ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${alert.severity === 'Critical' ? '#FEE2E2' : '#F1F5F9'}`,
                    display: 'flex', alignItems: 'flex-start', gap: 1.5
                  }}>
                    <Box sx={{ mt: 0.8, width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: alert.severity === 'Critical' ? '#DC2626' : '#F59E0B' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '0.85rem', mb: 0.5 }}>{alert.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.78rem', lineHeight: 1.4, fontWeight: 500 }}>{alert.message}</Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
