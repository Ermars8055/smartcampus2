import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Skeleton, IconButton, Tooltip, Fade, Grow, useTheme
} from '@mui/material';
import {
  Inventory2, TrendingDown, ShoppingCart, LocalShipping,
  Warning, People, Warehouse, Receipt, ArrowForward,
  Circle, TrendingUp
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import api from '../services/api';

const COLORS = ['#1E3A8A', '#2563EB', '#60A5FA', '#93C5FD', '#3B82F6', '#1D4ED8', '#DBEAFE', '#7C3AED'];

function StatCard({ title, value, icon, color, subtitle, onClick, index }) {
  return (
    <Grow in={true} timeout={(index + 1) * 200}>
      <Card sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? { 
          transform: 'translateY(-3px)', 
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        } : {},
        borderRadius: 3,
        border: '1px solid #F1F5F9',
        boxShadow: 'none',
        background: '#fff'
      }}
        onClick={onClick}>
        <CardContent sx={{ p: '16px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem' }}>
                {title}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mt: 0.5 }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar className="stat-avatar" sx={{
              width: 36, height: 36, borderRadius: 2,
              background: `${color}10`,
              color: color,
              '& svg': { fontSize: '1.2rem' }
            }}>
              {icon}
            </Avatar>
          </Box>
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            backgroundColor: color, opacity: 0.6
          }} />
        </CardContent>
      </Card>
    </Grow>
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
      <Box sx={{ p: 1 }}>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={6} sm={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
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

  const totalValue = stats?.total_inventory_value || 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Fade in={true}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
              Dashboard
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Resource Insights & Analytics
            </Typography>
          </Box>
          <Chip icon={<TrendingUp style={{ fontSize: 14 }} />} label="Live" size="small" 
            sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F0F9FF', color: '#0369A1' }} />
        </Box>
      </Fade>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Materials" value={stats?.total_materials || 0} icon={<Inventory2 />} color="#2563EB"
            subtitle="Catalog Items" onClick={() => navigate('/materials')} index={0} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Value" value={formatCurrency(totalValue)}
            icon={<Warehouse />} color="#059669" subtitle="Stock Assets" onClick={() => navigate('/inventory')} index={1} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Low Stock" value={stats?.low_stock_items || 0}
            icon={<Warning />} color="#DC2626" subtitle="Reorder Alerts" onClick={() => navigate('/inventory?low=true')} index={2} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Pending PR" value={stats?.pending_pr || 0}
            icon={<ShoppingCart />} color="#D97706" subtitle="Req Actions" onClick={() => navigate('/purchase-requests')} index={3} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Open PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Tracking" onClick={() => navigate('/purchase-orders')} index={4} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="GRN" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Receipts" onClick={() => navigate('/grn')} index={5} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#475569' }}>
              Allocation by Block
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={consumption} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="block_name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total_quantity" name="Quantity" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="total_value" name="Value" fill="#93C5FD" radius={[4, 4, 0, 0]} barSize={32} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #F1F5F9', height: '100%', boxShadow: 'none' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#475569' }}>
              Stock by Warehouse
            </Typography>
            <Box sx={{ position: 'relative', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockByWh} cx="50%" cy="50%" innerRadius={70} outerRadius={95}
                    dataKey="total_value" nameKey="warehouse_name" paddingAngle={5}>
                    {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={4} />)}
                  </Pie>
                  <RTooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Value']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{
                position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>{formatCurrency(totalValue)}</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 600 }}>TOTAL ASSETS</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Wide Trend Row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#475569' }}>
              Material Issuance Trend (Last 12 Months)
            </Typography>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -15, right: 30 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <RTooltip />
                <Area type="monotone" dataKey="total" name="Items Issued" stroke="#2563EB" strokeWidth={2.5} fill="url(#trendGrad)" dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#2563EB' }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2, borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#475569' }}>
              High-Velocity Materials
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="material_name" type="category" width={110} tick={{ fontSize: 9, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <RTooltip />
                <Bar dataKey="total_consumed" fill="#1E3A8A" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F8FAFC' }}>
               <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>Recent Transaction Log</Typography>
               <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/inventory')}>Full History</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {recentTx.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id} sx={{ '& td': { borderBottom: '1px solid #F8FAFC' }, '&:last-child td': { border: 'none' } }}>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{tx.material_name}</TableCell>
                      <TableCell align="center">
                        <Chip label={tx.transaction_type} size="small"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: tx.quantity > 0 ? '#ECFDF5' : '#FEF2F2', color: tx.quantity > 0 ? '#059669' : '#DC2626' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem', color: tx.quantity > 0 ? '#059669' : '#DC2626' }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
           <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, border: '1px solid #F1F5F9', boxShadow: 'none' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>System Alerts</Typography>
                <Chip label={`${alerts.length} Active`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E' }} />
              </Box>
              <Box sx={{ p: 1.5, display: 'flex', gap: 2, overflowX: 'auto' }}>
                {alerts.slice(0, 4).map((alert) => (
                  <Box key={alert.id} sx={{
                    p: 1.2, borderRadius: 2, minWidth: 260,
                    bgcolor: alert.severity === 'Critical' ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${alert.severity === 'Critical' ? '#FEE2E2' : '#F1F5F9'}`,
                    flexShrink: 0
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: alert.severity === 'Critical' ? '#DC2626' : '#F59E0B' }} />
                      <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.75rem' }}>{alert.title}</Typography>
                    </Box>
                    <Typography sx={{ color: '#64748B', fontSize: '0.68rem', ml: 2, mt: 0.2 }}>{alert.message}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
