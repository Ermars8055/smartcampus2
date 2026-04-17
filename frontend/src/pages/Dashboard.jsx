import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Skeleton, IconButton, Tooltip
} from '@mui/material';
import {
  Inventory2, TrendingDown, ShoppingCart, LocalShipping,
  Warning, People, Warehouse, Receipt, ArrowForward,
  Circle
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
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } : {},
      position: 'relative', overflow: 'hidden',
    }}
      onClick={onClick}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.5, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{
            width: 48, height: 48, borderRadius: 3,
            background: `linear-gradient(135deg, ${color}22, ${color}11)`,
            color: color,
          }}>
            {icon}
          </Avatar>
        </Box>
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, ${color}44)`,
        }} />
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
      <Box>
        <Grid container spacing={2.5}>
          {[...Array(6)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Dashboard</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>Overview of materials, procurement, and inventory</Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="Materials" value={stats?.total_materials || 0} icon={<Inventory2 />} color="#2563EB"
            subtitle="Active items" onClick={() => navigate('/materials')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="Inventory Value" value={formatCurrency(stats?.total_inventory_value || 0)}
            icon={<Warehouse />} color="#059669" subtitle="Total stock value" onClick={() => navigate('/inventory')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="Low Stock" value={stats?.low_stock_items || 0}
            icon={<Warning />} color="#DC2626" subtitle="Below reorder" onClick={() => navigate('/inventory?low=true')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="Pending PR" value={stats?.pending_pr || 0}
            icon={<ShoppingCart />} color="#D97706" subtitle="Awaiting action" onClick={() => navigate('/purchase-requests')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="Pending PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Open orders" onClick={() => navigate('/purchase-orders')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatCard title="GRN" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Total receipts" onClick={() => navigate('/grn')} />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Material Consumption by Block
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumption} margin={{ top: 25, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="block_name" tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} tickFormatter={(v) => formatCurrency(v)} />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(v, name) => [name === 'Value (₹)' ? formatCurrency(v) : v.toLocaleString() + ' Units', name]} />
                <Bar dataKey="total_quantity" name="Quantity" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_value" name="Value (₹)" fill="#60A5FA" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="total_value" position="top" formatter={(v) => v > 0 ? formatCurrency(v) : ''} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Stock by Warehouse
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stockByWh} cx="40%" cy="50%" innerRadius={60} outerRadius={100}
                  dataKey="total_value" nameKey="warehouse_name" paddingAngle={3}>
                  {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RTooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Value']}
                  contentStyle={{ borderRadius: 8 }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 500, color: '#334155' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Top Consumed Materials
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: 20, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} />
                <YAxis dataKey="material_name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }} />
                <RTooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [v.toLocaleString() + ' Units', 'Consumed']} />
                <Bar dataKey="total_consumed" name="Consumed" fill="#1E3A8A" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList dataKey="total_consumed" position="right" formatter={(v) => v.toLocaleString() + ' Units'} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Consumption Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} />
                <RTooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [v.toLocaleString() + ' Units', 'Total Consumed']} />
                <Line type="monotone" dataKey="total" name="Total Consumed" stroke="#2563EB"
                  strokeWidth={3} dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }}>
                  <LabelList dataKey="total" position="top" offset={12} formatter={(v) => v.toLocaleString() + ' Units'} style={{ fontSize: 12, fontWeight: 700, fill: '#2563EB' }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                Recent Transactions
              </Typography>
              <Chip label="View All" size="small" onClick={() => navigate('/inventory')}
                sx={{ cursor: 'pointer' }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Material</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTx.slice(0, 8).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{tx.material_name}</TableCell>
                      <TableCell>
                        <Chip label={tx.transaction_type} size="small"
                          color={tx.quantity > 0 ? 'success' : 'error'}
                          variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 600, fontSize: '0.8rem',
                        color: tx.quantity > 0 ? '#059669' : '#DC2626'
                      }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{tx.warehouse_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{tx.reference_number}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                Active Alerts
              </Typography>
              <Chip label={`${alerts.length} Active`} size="small" color="warning" />
            </Box>
            {alerts.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', py: 4 }}>
                No active alerts
              </Typography>
            ) : (
              alerts.slice(0, 6).map((alert) => (
                <Box key={alert.id} sx={{
                  p: 1.5, mb: 1, borderRadius: 2,
                  background: alert.severity === 'Critical' ? '#FEF2F2' :
                    alert.severity === 'Warning' ? '#FFFBEB' : '#F0F9FF',
                  border: `1px solid ${alert.severity === 'Critical' ? '#FECACA' :
                    alert.severity === 'Warning' ? '#FDE68A' : '#BAE6FD'}`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Circle sx={{
                      fontSize: 8,
                      color: alert.severity === 'Critical' ? '#DC2626' :
                        alert.severity === 'Warning' ? '#D97706' : '#2563EB'
                    }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      {alert.title}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                    {alert.message}
                  </Typography>
                </Box>
              ))
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
