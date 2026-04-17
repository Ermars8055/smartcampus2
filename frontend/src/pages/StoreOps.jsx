import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Tab, Tabs
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';

export default function StoreOperations() {
  const [tab, setTab] = useState(0);
  const [issues, setIssues] = useState([]);
  const [returns, setReturns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});
  const [stocks, setStocks] = useState([]);

  const load = () => {
    api.get('/api/issues').then(r => setIssues(r.data));
    api.get('/api/returns').then(r => setReturns(r.data));
    api.get('/api/transfers').then(r => setTransfers(r.data));
  };
  useEffect(() => {
    load();
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/blocks').then(r => setBlocks(r.data));
    api.get('/api/inventory').then(r => setStocks(r.data));
  }, []);

  const createIssue = async () => {
    try {
      await api.post('/api/issues', { ...form, items: form.items.map(it => ({ material_id: it.material_id, quantity: parseFloat(it.quantity), rate: parseFloat(it.rate) || 0 })) });
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const createReturn = async () => {
    try {
      await api.post('/api/returns', { ...form, items: form.items.map(it => ({ material_id: it.material_id, quantity: parseFloat(it.quantity), condition: it.condition || 'Good' })) });
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const createTransfer = async () => {
    try {
      await api.post('/api/transfers', { ...form, items: form.items.map(it => ({ material_id: it.material_id, quantity: parseFloat(it.quantity) })) });
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Store Operations</Typography>
      <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>Issue, return, and transfer materials</Typography>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Issues (${issues.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label={`Returns (${returns.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label={`Transfers (${transfers.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
        </Tabs>
      </Card>

      {/* ISSUES TAB */}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setForm({ warehouse_id: warehouses[0]?.id || '', project_id: projects[0]?.id || '', issued_to_block_id: '', issued_to_department: '', purpose: '', received_by_name: '', items: [{ material_id: '', quantity: '', rate: '' }] });
              setDialog('issue');
            }}>Issue Material</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Issue No.</TableCell><TableCell>Warehouse</TableCell><TableCell>Block / Dept</TableCell>
                  <TableCell>Items</TableCell><TableCell>Issued By</TableCell><TableCell>Received By</TableCell>
                  <TableCell>Date</TableCell><TableCell>Status</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {issues.map(iss => (
                    <TableRow key={iss.id}>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{iss.issue_number}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{iss.warehouse_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{iss.block_name || iss.issued_to_department || iss.issued_to_contractor || '-'}</TableCell>
                      <TableCell>
                        {iss.items?.map(it => (
                          <Chip key={it.id} label={`${it.material_name}: ${it.quantity}`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.3, fontSize: '0.7rem' }} />
                        ))}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{iss.issued_by_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{iss.received_by_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{iss.created_at ? formatDate(iss.created_at) : ''}</TableCell>
                      <TableCell><Chip label={iss.status} size="small" color="success" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* RETURNS TAB */}
      {tab === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setForm({ warehouse_id: warehouses[0]?.id || '', project_id: projects[0]?.id || '', returned_from_block_id: '', return_type: 'Unused', returned_by_name: '', items: [{ material_id: '', quantity: '', condition: 'Good' }] });
              setDialog('return');
            }}>Record Return</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Return No.</TableCell><TableCell>Warehouse</TableCell><TableCell>From Block</TableCell>
                  <TableCell>Type</TableCell><TableCell>Items</TableCell><TableCell>Date</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {returns.map(ret => (
                    <TableRow key={ret.id}>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{ret.return_number}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{ret.warehouse_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{ret.block_name || '-'}</TableCell>
                      <TableCell><Chip label={ret.return_type} size="small" color={ret.return_type === 'Damaged' ? 'error' : 'success'} variant="outlined" /></TableCell>
                      <TableCell>
                        {ret.items?.map(it => <Chip key={it.id} label={`${it.material_name}: ${it.quantity}`} size="small" variant="outlined" sx={{ mr: 0.5, fontSize: '0.7rem' }} />)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{ret.created_at ? formatDate(ret.created_at) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* TRANSFERS TAB */}
      {tab === 2 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setForm({ from_warehouse_id: '', to_warehouse_id: '', project_id: projects[0]?.id || '', items: [{ material_id: '', quantity: '' }] });
              setDialog('transfer');
            }}>New Transfer</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Transfer No.</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
                  <TableCell>Items</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{t.transfer_number}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{t.from_warehouse_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{t.to_warehouse_name}</TableCell>
                      <TableCell>
                        {t.items?.map(it => <Chip key={it.id} label={`${it.material_name}: ${it.quantity}`} size="small" variant="outlined" sx={{ mr: 0.5, fontSize: '0.7rem' }} />)}
                      </TableCell>
                      <TableCell><Chip label={t.status} size="small" color="success" sx={{ fontSize: '0.7rem' }} /></TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{t.created_at ? formatDate(t.created_at) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Issue Dialog */}
      <Dialog open={dialog === 'issue'} onClose={() => setDialog('')} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Issue Material</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Warehouse</InputLabel>
                <Select value={form.warehouse_id || ''} label="Warehouse" onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Project</InputLabel>
                <Select value={form.project_id || ''} label="Project" onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Issue To Block</InputLabel>
                <Select value={form.issued_to_block_id || ''} label="Issue To Block" onChange={e => setForm({ ...form, issued_to_block_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {blocks.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}><TextField fullWidth label="Department / Contractor" value={form.issued_to_department || ''} onChange={e => setForm({ ...form, issued_to_department: e.target.value })} /></Grid>
            <Grid size={6}><TextField fullWidth label="Received By" value={form.received_by_name || ''} onChange={e => setForm({ ...form, received_by_name: e.target.value })} /></Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          {form.items?.map((item, i) => {
            const available = form.warehouse_id && item.material_id ? stocks.find(s => s.warehouse_id === form.warehouse_id && s.material_id === item.material_id)?.quantity || 0 : 0;
            return (
            <Grid container spacing={1} key={i} sx={{ mb: 1 }}>
              <Grid size={5}>
                <MaterialSelect 
                  materials={materials} 
                  value={item.material_id} 
                  onChange={val => { const items = [...form.items]; items[i].material_id = val; setForm({ ...form, items }); }} 
                />
              </Grid>
              <Grid size={3}>
                <TextField fullWidth size="small" label="Quantity" type="number" value={item.quantity} 
                  onChange={e => { const items = [...form.items]; items[i].quantity = e.target.value; setForm({ ...form, items }); }} 
                  error={available < item.quantity && item.quantity > 0}
                  helperText={<Typography component="span" sx={{ fontSize: '0.65rem' }}>Available: {available}</Typography>} />
              </Grid>
              <Grid size={3}><TextField fullWidth size="small" label="Rate (₹)" type="number" value={item.rate || ''} onChange={e => { const items = [...form.items]; items[i].rate = e.target.value; setForm({ ...form, items }); }} /></Grid>
              <Grid size={1}>{form.items.length > 1 && <IconButton size="small" color="error" onClick={() => { const items = form.items.filter((_, idx) => idx !== i); setForm({ ...form, items }); }}><Delete fontSize="small" /></IconButton>}</Grid>
            </Grid>
          )})}
          <Button size="small" startIcon={<Add />} onClick={() => setForm({ ...form, items: [...(form.items || []), { material_id: '', quantity: '', rate: '' }] })}>Add Item</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={createIssue}>Issue</Button></DialogActions>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={dialog === 'return'} onClose={() => setDialog('')} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Record Material Return</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Warehouse</InputLabel>
                <Select value={form.warehouse_id || ''} label="Warehouse" onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Return Type</InputLabel>
                <Select value={form.return_type || 'Unused'} label="Return Type" onChange={e => setForm({ ...form, return_type: e.target.value })}>
                  <MenuItem value="Unused">Unused</MenuItem><MenuItem value="Damaged">Damaged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>From Block</InputLabel>
                <Select value={form.returned_from_block_id || ''} label="From Block" onChange={e => setForm({ ...form, returned_from_block_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {blocks.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          {form.items?.map((item, i) => (
            <Grid container spacing={1} key={i} sx={{ mb: 1 }}>
              <Grid size={5}>
                <MaterialSelect 
                  materials={materials} 
                  value={item.material_id} 
                  onChange={val => { const items = [...form.items]; items[i].material_id = val; setForm({ ...form, items }); }} 
                />
              </Grid>
              <Grid size={3}><TextField fullWidth size="small" label="Quantity" type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[i].quantity = e.target.value; setForm({ ...form, items }); }} /></Grid>
              <Grid size={3}>
                <FormControl fullWidth size="small"><InputLabel>Condition</InputLabel>
                  <Select value={item.condition || 'Good'} label="Condition" onChange={e => { const items = [...form.items]; items[i].condition = e.target.value; setForm({ ...form, items }); }}>
                    <MenuItem value="Good">Good</MenuItem><MenuItem value="Damaged">Damaged</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          ))}
          <Button size="small" startIcon={<Add />} onClick={() => setForm({ ...form, items: [...(form.items || []), { material_id: '', quantity: '', condition: 'Good' }] })}>Add Item</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={createReturn}>Record Return</Button></DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={dialog === 'transfer'} onClose={() => setDialog('')} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Stock Transfer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>From Warehouse</InputLabel>
                <Select value={form.from_warehouse_id || ''} label="From Warehouse" onChange={e => setForm({ ...form, from_warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>To Warehouse</InputLabel>
                <Select value={form.to_warehouse_id || ''} label="To Warehouse" onChange={e => setForm({ ...form, to_warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>Project</InputLabel>
                <Select value={form.project_id || ''} label="Project" onChange={e => setForm({ ...form, project_id: e.target.value })}>
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          {form.items?.map((item, i) => {
            const available = form.from_warehouse_id && item.material_id ? stocks.find(s => s.warehouse_id === form.from_warehouse_id && s.material_id === item.material_id)?.quantity || 0 : 0;
            return (
            <Grid container spacing={1} key={i} sx={{ mb: 1 }}>
              <Grid size={7}>
                <MaterialSelect 
                  materials={materials} 
                  value={item.material_id} 
                  onChange={val => { const items = [...form.items]; items[i].material_id = val; setForm({ ...form, items }); }} 
                />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth size="small" label="Quantity" type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[i].quantity = e.target.value; setForm({ ...form, items }); }} 
                  error={available < item.quantity && item.quantity > 0}
                  helperText={<Typography component="span" sx={{ fontSize: '0.65rem' }}>Available: {available}</Typography>} />
              </Grid>
            </Grid>
          )})}
          <Button size="small" startIcon={<Add />} onClick={() => setForm({ ...form, items: [...(form.items || []), { material_id: '', quantity: '' }] })}>Add Item</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={createTransfer}>Complete Transfer</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
