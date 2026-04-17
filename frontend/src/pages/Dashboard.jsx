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
    <Grow in={true} timeout={(index + 1) * 300}>
      <Card sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onClick ? { 
          transform: 'translateY(-6px)', 
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          '& .stat-avatar': { transform: 'scale(1.1)' }
        } : {},
        position: 'relative', overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid rgba(226, 232, 240, 0.6)',
      }}
        onClick={onClick}>
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mt: 0.5 }}>
                {value}
              </Typography>
            </Box>
            <Avatar className="stat-avatar" sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: `linear-gradient(135deg, ${color}22, ${color}11)`,
              color: color,
              transition: 'transform 0.3s ease',
            }}>
              {icon}
            </Avatar>
          </Box>
          {subtitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                {subtitle}
              </Typography>
            </Box>
          )}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
            background: `linear-gradient(90deg, ${color}, ${color}22)`,
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

  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ p: 1 }}>
        <Grid container spacing={3}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={130} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
          <Grid item xs={12} lg={8}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
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
    <Box sx={{ pb: 4 }}>
      <Fade in={true}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              Enterprise Resource Overview & Real-time Analytics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip icon={<TrendingUp sx={{ fontSize: '1rem !important' }} />} label="Live Updates" 
              size="small" sx={{ background: '#F0F9FF', color: '#0369A1', fontWeight: 600, border: '1px solid #BAE6FD' }} />
          </Box>
        </Box>
      </Fade>

      {/* Stats Cards - Responsive Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Total Materials" value={stats?.total_materials || 0} icon={<Inventory2 />} color="#2563EB"
            subtitle="Cataloged Items" onClick={() => navigate('/materials')} index={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Inventory Value" value={formatCurrency(totalValue)}
            icon={<Warehouse />} color="#059669" subtitle="On-hand Valuation" onClick={() => navigate('/inventory')} index={1} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Low Stock" value={stats?.low_stock_items || 0}
            icon={<Warning />} color="#DC2626" subtitle="Requires Attention" onClick={() => navigate('/inventory?low=true')} index={2} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Pending PR" value={stats?.pending_pr || 0}
            icon={<ShoppingCart />} color="#D97706" subtitle="Pending Approval" onClick={() => navigate('/purchase-requests')} index={3} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Open PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Track Orders" onClick={() => navigate('/purchase-orders')} index={4} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="GRN Total" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Items Received" onClick={() => navigate('/grn')} index={5} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Main Bar Chart - Gradient Enhanced */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 3, borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Resource Allocation by Block
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={consumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="block_name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RTooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Bar dataKey="total_quantity" name="Quantity" fill="url(#colorQty)" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="total_value" name="Value (₹)" fill="url(#colorVal)" radius={[6, 6, 0, 0]} barSize={24} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Donut Chart with Center Label */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
              Stock by Warehouse
            </Typography>
            <Box sx={{ position: 'relative', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockByWh} cx="50%" cy="50%" innerRadius={85} outerRadius={115}
                    dataKey="total_value" nameKey="warehouse_name" paddingAngle={8} stroke="none">
                    {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={4} />)}
                  </Pie>
                  <RTooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Total Value']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, bottom: 0 }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{
                position: 'absolute', top: '44%', left: '50%', transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none'
              }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>{formatCurrency(totalValue)}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>TOTAL VALUE</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3 - Consumption Details */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
              High-Velocity Materials
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: 30, right: 30 }}>
                <defs>
                   <linearGradient id="colorTop" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis dataKey="material_name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
                <RTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="total_consumed" name="Consumed" fill="url(#colorTop)" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1E293B' }}>
              Issuance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RTooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="total" name="Items Issued" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)"
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Activity & Alerts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
               <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Operational Log
              </Typography>
              <Chip label="View History" size="small" variant="outlined" onClick={() => navigate('/inventory')} 
                sx={{ cursor: 'pointer', borderRadius: 2, fontWeight: 600, color: '#64748B' }} />
            </Box>
            <TableContainer sx={{ p: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { border: 'none', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>
                    <TableCell>Material</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTx.slice(0, 7).map((tx) => (
                    <TableRow key={tx.id} sx={{ '& td': { borderBottom: '1px solid #F8FAFC' }, '&:last-child td': { border: 'none' } }}>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{tx.material_name}</TableCell>
                      <TableCell>
                        <Chip label={tx.transaction_type} size="small"
                          sx={{ 
                            fontSize: '0.65rem', fontWeight: 700, height: 20,
                            background: tx.quantity > 0 ? '#ECFDF5' : '#FEF2F2',
                            color: tx.quantity > 0 ? '#059669' : '#DC2626',
                            border: `1px solid ${tx.quantity > 0 ? '#A7F3D0' : '#FECACA'}`
                          }} />
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 700, fontSize: '0.85rem',
                        color: tx.quantity > 0 ? '#059669' : '#DC2626'
                      }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>{tx.warehouse_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Priority Alerts
              </Typography>
              <Chip label={`${alerts.length} New`} size="small" sx={{ background: '#FFF7ED', color: '#C2410C', fontWeight: 700 }} />
            </Box>
            <Box sx={{ p: 2 }}>
              {alerts.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>All systems operational. No active alerts.</Typography>
                </Box>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <Box key={alert.id} sx={{
                    p: 2, mb: 1.5, borderRadius: 3,
                    background: alert.severity === 'Critical' ? 'rgba(239, 68, 68, 0.04)' :
                      alert.severity === 'Warning' ? 'rgba(245, 158, 11, 0.04)' : '#F8FAFC',
                    border: `1px solid ${alert.severity === 'Critical' ? '#FEE2E2' :
                      alert.severity === 'Warning' ? '#FEF3C7' : '#E2E8F0'}`,
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.01)' }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{
                        mt: 0.5, width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: alert.severity === 'Critical' ? '#EF4444' :
                          alert.severity === 'Warning' ? '#F59E0B' : '#3B82F6',
                        boxShadow: `0 0 10px ${alert.severity === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : 'transparent'}`
                      }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block', lineHeight: 1.4 }}>
                          {alert.message}
                        </Typography>
                      </Box>
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
