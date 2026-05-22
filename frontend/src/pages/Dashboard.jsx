import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Skeleton, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, FormControl, Select, MenuItem, useTheme, useMediaQuery
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

const CustomXAxisTick = ({ x, y, payload }) => {
  if (!payload.value) return null;
  const words = payload.value.split(' ');
  return (
    <g transform={`translate(${x},${y})`}>
      {words.map((word, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={12}
          textAnchor="middle"
          fill="#64748B"
          fontSize="10px"
          fontWeight="600"
        >
          {word}
        </text>
      ))}
    </g>
  );
};

function StatCard({ title, value, icon, color, subtitle, onClick }) {
  return (
    <Card sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid #F1F5F9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative', 
      overflow: 'hidden',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)' } : {},
    }} onClick={onClick}>
      <CardContent sx={{ p: '20px 24px', '&:last-child': { pb: '20px' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ 
              color: '#64748B', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em', 
              fontSize: '0.65rem',
              mb: 0.5,
              display: 'block'
            }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: '#0F172A', 
              fontSize: '1.75rem',
              lineHeight: 1.2
            }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{
            width: 48, height: 48, borderRadius: '14px',
            bgcolor: `${color}10`,
            color: color,
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 26 } })}
          </Avatar>
        </Box>
      </CardContent>
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px',
        background: `linear-gradient(90deg, ${color}, ${color}22)`,
      }} />
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
  const [period, setPeriod] = useState('all');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Drilldown state
  const [drilldownBlock, setDrilldownBlock] = useState(null);
  const [drilldownData, setDrilldownData] = useState([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    let params = {};
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

    Promise.all([
      api.get('/api/dashboard/stats', { params }),
      api.get('/api/dashboard/consumption-by-building', { params }),
      api.get('/api/dashboard/stock-by-warehouse', { params }),
      api.get('/api/dashboard/top-consumed-materials', { params }),
      api.get('/api/dashboard/recent-transactions', { params }),
      api.get('/api/dashboard/alerts', { params }),
      api.get('/api/dashboard/consumption-trend', { params }),
    ]).then(([s, c, sw, tm, tx, al, tr]) => {
      setStats(s.data);
      setConsumption(c.data);
      setStockByWh(sw.data);
      setTopMaterials(tm.data);
      setRecentTx(tx.data);
      setAlerts(al.data);
      setTrend(tr.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  const handleBlockClick = (data) => {
    let blockName = null;
    if (data && data.activePayload && data.activePayload.length) {
      blockName = data.activePayload[0].payload.building_name;
    } else if (data && data.building_name) {
      blockName = data.building_name;
    }

    if (!blockName) return;

    setDrilldownBlock(blockName);
    setDrilldownLoading(true);
    api.get('/api/dashboard/material-cost-by-building')
      .then(res => {
         const specificData = res.data.filter(item => item.building_name === blockName);
         setDrilldownData(specificData);
      })
      .catch(console.error)
      .finally(() => setDrilldownLoading(false));
  };

  if (loading) {
    return (
      <Box>
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
    if (v >= 10000000) return `₹${(v / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
    if (v >= 1000) return `₹${(v / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}K`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>Dashboard</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Overview of materials, procurement, and inventory</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: '#fff' }}>
          <Select value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            <MenuItem value="all">Time Period: All Time</MenuItem>
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="last_month">Last Month</MenuItem>
            <MenuItem value="ytd">Year to Date (YTD)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* --- ROW 1: Stats Cards (6 in a row) --- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Materials" value={stats?.total_materials || 0}
            icon={<Inventory2 />} color="#2563EB" subtitle="Active items" onClick={() => navigate('/materials')} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Inventory Value" value={formatCurrency(stats?.total_inventory_value || 0)}
            icon={<TrendingDown />} color="#10B981" subtitle="Total stock value" />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Low Stock" value={stats?.low_stock_items || 0}
            icon={<Warning />} color="#EF4444" subtitle="Below reorder" onClick={() => navigate('/inventory')} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Pending PR" value={stats?.pending_pr || 0}
            icon={<ShoppingCart />} color="#F59E0B" subtitle="Awaiting action" onClick={() => navigate('/purchase-requests')} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="Pending PO" value={stats?.pending_po || 0}
            icon={<Receipt />} color="#7C3AED" subtitle="Open orders" onClick={() => navigate('/purchase-orders')} />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard title="GRN" value={stats?.recent_grn_count || 0}
            icon={<LocalShipping />} color="#0891B2" subtitle="Total receipts" onClick={() => navigate('/grn')} />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Building Spend (₹)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>*Click on any bar to drilldown</Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumption} margin={{ top: 20, right: isMobile ? 0 : 10, bottom: isMobile ? 60 : 40, left: isMobile ? -20 : 10 }} onClick={handleBlockClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="building_name" 
                  tick={<CustomXAxisTick />} 
                  interval={0}
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} tickFormatter={(v) => formatCurrency(v)} />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  formatter={(v, name) => [formatCurrency(v), 'Total Spend']} />
                <Bar dataKey="total_value" name="Value (₹)" fill="#2563EB" radius={[6, 6, 0, 0]} onClick={handleBlockClick} style={{ cursor: 'pointer' }}>
                  <LabelList dataKey="total_value" position="top" formatter={(v) => v > 0 ? formatCurrency(v) : ''} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Stock by Store
            </Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <Pie 
                    data={stockByWh} 
                    cx="50%" 
                    cy="42%" 
                    innerRadius={60} 
                    outerRadius={85}
                    dataKey="total_value" 
                    nameKey="warehouse_name" 
                    paddingAngle={5}
                  >
                    {stockByWh.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip 
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Value']}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  />
                  <Legend 
                    verticalAlign="bottom"
                    content={(props) => {
                      const { payload } = props;
                      return (
                        <Box sx={{ 
                          maxHeight: '130px', 
                          overflowY: 'auto', 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 0.5, 
                          justifyContent: 'center',
                          mt: -2,
                          '&::-webkit-scrollbar': { width: '4px' },
                          '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: '4px' }
                        }}>
                          {payload.map((entry, index) => (
                            <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', fontSize: 10, fontWeight: 600, color: '#64748B', px: 0.5 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, mr: 0.5 }} />
                              {entry.value}
                            </Box>
                          ))}
                        </Box>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Highest Spend Materials
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topMaterials} layout="vertical" margin={{ left: 20, right: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="material_name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }} />
                <RTooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [formatCurrency(v), 'Total Spend']} />
                <Bar dataKey="total_value" name="Spend" fill="#1D4ED8" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList dataKey="total_value" position="right" formatter={(v) => formatCurrency(v)} style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
              Monthly Spend Trend
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }} tickFormatter={(v) => formatCurrency(v)} />
                <RTooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => [formatCurrency(v), 'Total Spend']} />
                <Line type="monotone" dataKey="total_value" name="Total Spend" stroke="#2563EB"
                  strokeWidth={3} dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }}>
                  <LabelList dataKey="total_value" position="top" offset={12} formatter={(v) => formatCurrency(v)} style={{ fontSize: 12, fontWeight: 700, fill: '#2563EB' }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                Recent Transactions
              </Typography>
              <Chip label="View All" size="small" onClick={() => navigate('/inventory')}
                sx={{ cursor: 'pointer' }} />
            </Box>
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {recentTx.slice(0, 8).map(tx => (
                  <Card key={tx.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{tx.material_name}</Typography>
                      <Chip label={tx.transaction_type} size="small" color={tx.quantity > 0 ? 'success' : 'error'} variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Box>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>Store: {tx.warehouse_name}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748B' }}>Ref: {tx.reference_number}</Typography>
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: tx.quantity > 0 ? '#059669' : '#DC2626' }}>
                        {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                      </Typography>
                    </Box>
                  </Card>
                ))}
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell>Store</TableCell>
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
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
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

      {/* Drilldown Modal */}
      <Dialog open={!!drilldownBlock} onClose={() => setDrilldownBlock(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          Building Spend Details: {drilldownBlock}
          <Chip 
            label={`${formatCurrency(drilldownData.reduce((acc, curr) => acc + curr.total_cost, 0))} Total`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 700, height: 28 }}
          />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {drilldownLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
               <Skeleton variant="rectangular" height={200} />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Consumed Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1D4ED8' }} align="right">Total Cost (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drilldownData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#64748B' }}>No data found for this block.</TableCell>
                    </TableRow>
                  ) : (
                    drilldownData.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{row.material_name}</TableCell>
                        <TableCell align="right">{row.total_quantity?.toLocaleString()} Units</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#1E293B' }}>₹ {row.total_cost?.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDrilldownBlock(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
