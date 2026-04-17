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
      transition: 'all 0.2s ease',
      '&:hover': onClick ? { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {},
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      boxShadow: 'none'
    }}
      onClick={onClick}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.62rem' }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mt: 0.5, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ width: 38, height: 38, bgcolor: `${color}10`, color: color, borderRadius: 1.5 }}>
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
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={4} lg={2} key={i}>
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 2 }} />
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>NissiGrid Smart Stores</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>Enterprise Materials Governance Platform</Typography>
      </Box>

      {/* Main Single Grid Container for Perfect Vertical Alignment */}
      <Grid container spacing={2}>
        {/* Top Aligned Stats Cards */}
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="Total Materials" value={stats?.total_materials || 0} icon={<Inventory2 />} color="#2563EB"
            subtitle="Cataloged items" onClick={() => navigate('/materials')} />
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
          <StatCard title="Open PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Open orders" onClick={() => navigate('/purchase-orders')} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <StatCard title="GRN Total" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Total receipts" onClick={() => navigate('/grn')} />
        </Grid>

        {/* --- ROW 1: Wide Consumption & Pie --- */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3, color: '#334155', fontSize: '0.95rem' }}>
              Material Consumption by Block (Quantity & Value)
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={consumption} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="block_name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <RTooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="total_quantity" name="Quantity" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total_quantity" position="top" style={{ fontSize: 9, fill: '#64748B' }} />
                </Bar>
                <Bar dataKey="total_value" name="Value (₹)" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 10, fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#334155', fontSize: '0.95rem' }}>
              Stock by Warehouse
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stockByWh} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  dataKey="total_value" nameKey="warehouse_name" paddingAngle={2}>
                  {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RTooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Value']} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* --- ROW 2: Wide Trend & Top Materials --- */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#334155', fontSize: '0.95rem' }}>
              Monthly Issuance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ right: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RTooltip />
                <Line type="monotone" dataKey="total" name="Issued" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }}>
                  <LabelList dataKey="total" position="top" offset={10} style={{ fontSize: 9, fill: '#2563EB', fontWeight: 700 }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#334155', fontSize: '0.95rem' }}>
              Top Consumed
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="material_name" type="category" width={110} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTooltip />
                <Bar dataKey="total_consumed" fill="#1E3A8A" radius={[0, 4, 4, 0]}>
                   <LabelList dataKey="total_consumed" position="right" style={{ fontSize: 9, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* --- ROW 3: Log & Alerts (8/4 Split) --- */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Recent Activity Log</Typography>
              <Chip label="Full History" size="small" variant="outlined" sx={{ cursor: 'pointer', fontSize: '0.7rem' }} onClick={() => navigate('/inventory')} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>Activity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>Warehouse</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTx.slice(0, 6).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{tx.material_name}</TableCell>
                      <TableCell>
                        <Chip label={tx.transaction_type} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: tx.quantity > 0 ? '#059669' : '#DC2626' }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{tx.warehouse_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2, boxShadow: 'none', height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9' }}>
               <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Critical System Alerts</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              {alerts.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 4 }}>System OK</Typography>
              ) : (
                alerts.slice(0, 4).map((alert) => (
                  <Box key={alert.id} sx={{
                    p: 1.2, mb: 1, borderRadius: 1.5,
                    bgcolor: alert.severity === 'Critical' ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${alert.severity === 'Critical' ? '#FEE2E2' : '#F1F5F9'}`
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem' }}>{alert.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>{alert.message}</Typography>
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
