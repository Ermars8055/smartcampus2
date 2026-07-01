import { useState, useEffect, useMemo, useRef } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Tooltip, TableSortLabel, Tabs, Tab, Autocomplete
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { Close, Inventory2, Add, Delete, AccountTree, Warehouse, Comment, InfoOutlined, Outbox, CheckCircle, Apartment, Layers, MeetingRoom, Search, Business } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function MaterialIssue() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Modal states: if indent is null, it's a direct issue
  const [issueModal, setIssueModal] = useState({ open: false, isDirect: false, indent: null, items: [], project_id: '', warehouse_id: '', remarks: '', department: '', building_id: '', floor_id: '', room_id: '' });
  const [viewIssueModal, setViewIssueModal] = useState({ open: false, issue: null });

  const barcodeBufferRef = useRef('');
  const barcodeTimeoutRef = useRef(null);
  const lastKeyTimeRef = useRef(performance.now());

  const handleBarcodeScan = (code) => {
    const mat = materials.find(m => m.code === code);
    if (!mat) {
      showMessage(`Material with code ${code} not found!`, 'Error', 'error');
      return;
    }

    setIssueModal(prev => {
      const newItems = [...prev.items];
      const existingIndex = newItems.findIndex(it => it.material_id === mat.id);
      
      if (existingIndex >= 0) {
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          issue_qty: (Number(newItems[existingIndex].issue_qty) || 0) + 1
        };
      } else {
        const emptyIndex = newItems.findIndex(it => !it.material_id);
        if (emptyIndex >= 0) {
          newItems[emptyIndex] = {
            ...newItems[emptyIndex],
            material_id: mat.id,
            issue_qty: 1
          };
        } else {
          newItems.push({ material_id: mat.id, issue_qty: 1 });
        }
      }
      return { ...prev, items: newItems };
    });
  };

  useEffect(() => {
    if (!issueModal.open || !issueModal.isDirect) return;

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey || (e.key.length > 1 && e.key !== 'Enter')) return;

      const now = e.timeStamp;
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Identify fast scanner input or the very first character '{'
      if (timeDiff <= 50 || e.key === '{') {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current) {
          try {
            const parsed = JSON.parse(barcodeBufferRef.current);
            if (parsed.smartcampus_type === 'material_master' && parsed.code) {
              handleBarcodeScan(parsed.code);
            }
          } catch (err) {
            // Not valid JSON, discard silently
          }
          barcodeBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        if (timeDiff > 50 && e.key === '{') {
           barcodeBufferRef.current = e.key;
        } else if (timeDiff <= 50) {
           barcodeBufferRef.current += e.key;
        } else {
           // Slow human typing, not starting with '{'
           barcodeBufferRef.current = '';
        }

        if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
        barcodeTimeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [issueModal.open, issueModal.isDirect, materials]);

  const load = async () => {
    try {
      const indRes = await api.get('/api/indents');
      setIndents(indRes.data);
      const issRes = await api.get('/api/issues');
      setIssues(issRes.data);
      const stRes = await api.get('/api/inventory');
      setStocks(stRes.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
      api.get('/api/departments/names').then(r => setDepartmentsList(r.data)).catch(() => setDepartmentsList([]));
      api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');

  const [tabValue, setTabValue] = useState('Pending');
  const [sortConfig, setSortConfig] = useState({ key: 'sortDate', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstitution, setFilterInstitution] = useState(null);

  const handleDepartmentChange = (newDept) => {
    if (newDept) {
      api.get(`/api/rooms?department_name=${encodeURIComponent(newDept)}`).then(r => {
        const fetchedRooms = r.data || [];
        const uniqueBuildings = new Map();
        const uniqueFloors = new Map();

        fetchedRooms.forEach(room => {
          if (room.building_id && room.building_name) {
            uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
          }
          if (room.floor_id && room.floor_name) {
            uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
          }
        });

        const masterDepts = allDepartments.filter(d => d.name === newDept);
        masterDepts.forEach(d => {
          if (d.building_id && d.building_name) {
            uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
          }
        });

        const bldgs = Array.from(uniqueBuildings.values());
        const flrs = Array.from(uniqueFloors.values());

        setBuildings(bldgs);
        setFloors(flrs);
        setRooms(fetchedRooms);

        let nextBuildingId = '';
        let nextFloorId = '';
        let nextRoomId = '';

        if (bldgs.length === 1) nextBuildingId = bldgs[0].id;
        const availableFloors = flrs.filter(f => !nextBuildingId || f.building_id === nextBuildingId);
        if (availableFloors.length === 1) nextFloorId = availableFloors[0].id;
        const availableRooms = fetchedRooms.filter(rm => !nextFloorId || rm.floor_id === nextFloorId);
        if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;

        setIssueModal(prev => ({ ...prev, department: newDept, building_id: nextBuildingId, floor_id: nextFloorId, room_id: nextRoomId }));
      }).catch(() => {
        setBuildings([]); setFloors([]); setRooms([]);
        setIssueModal(prev => ({ ...prev, department: newDept, building_id: '', floor_id: '', room_id: '' }));
      });
    } else {
      setBuildings([]); setFloors([]); setRooms([]);
      setIssueModal(prev => ({ ...prev, department: '', building_id: '', floor_id: '', room_id: '' }));
    }
  };

  const handleBuildingChange = (buildingId) => {
    let nextFloorId = ''; let nextRoomId = '';
    const availableFloors = floors.filter(f => f.building_id === buildingId);
    if (availableFloors.length === 1) {
      nextFloorId = availableFloors[0].id;
      const availableRooms = rooms.filter(rm => rm.floor_id === nextFloorId);
      if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;
    }
    setIssueModal(prev => ({ ...prev, building_id: buildingId, floor_id: nextFloorId, room_id: nextRoomId }));
  };

  const handleFloorChange = (floorId) => {
    let nextRoomId = '';
    const availableRooms = rooms.filter(rm => rm.floor_id === floorId);
    if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;
    setIssueModal(prev => ({ ...prev, floor_id: floorId, room_id: nextRoomId }));
  };

  const handleRequestSort = (property) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc';
    const newDir = isAsc ? 'desc' : 'asc';
    setSortConfig({ key: property, direction: newDir });
  };

  const combinedList = useMemo(() => {
    let list = [
      ...pendingIndents.map(ind => {
        const loc = [ind.building_name, ind.floor, ind.room_name].filter(Boolean).join('-');
        const personStrValue = (ind.department && loc) ? `${ind.department} (${loc})` : (ind.department || loc || ind.requester_name || 'Not Specified');
        const pendingItemsCount = ind.items?.filter(it => (it.approved_quantity || it.requested_quantity) > (it.issued_quantity || 0)).length || 0;
        return {
          type: 'indent', ...ind, sortDate: new Date(ind.created_at).getTime(),
          idStr: ind.indent_number, personStr: personStrValue, itemCount: ind.items?.length || 0,
          institutionName: ind.institution_name || ind.project_name || 'Not Specified',
          pendingItemCount: pendingItemsCount,
          derivedStatus: ind.status === 'Approved' ? 'Pending' : 'Partial'
        };
      }),
      ...issues.map(iss => {
        const dept = iss.issued_to_department || iss.issued_to_contractor || iss.received_by_name;
        const loc = [iss.building_name, iss.floor_name, iss.room_name].filter(Boolean).join('-');
        const personStrValue = (dept && loc) ? `${dept} (${loc})` : (dept || loc || iss.issued_by_name || 'Not Specified');
        return {
          type: 'issue', ...iss, sortDate: new Date(iss.created_at).getTime(),
          idStr: iss.issue_number, personStr: personStrValue, itemCount: iss.items?.length || 0,
          institutionName: iss.project_name || 'Not Specified',
          derivedStatus: iss.is_acknowledged ? 'Acknowledged' : 'Completed',
          acknowledgedByName: iss.acknowledged_by_name
        };
      })
    ];

    list.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'status') {
        aVal = a.derivedStatus;
        bVal = b.derivedStatus;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [pendingIndents, issues, sortConfig]);

  const filteredList = useMemo(() => {
    let list = combinedList;
    if (tabValue !== 'All') {
      list = list.filter(row => row.derivedStatus === tabValue);
    }
    if (filterInstitution) {
      list = list.filter(row => row.institutionName === filterInstitution.name);
    }
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(row => row.idStr?.toLowerCase().includes(lowerSearch));
    }
    return list;
  }, [combinedList, tabValue, searchTerm]);

  const openIssueModal = (indent) => {
    const items = indent.items
      .map(it => {
        const approvedQty = it.approved_quantity || it.requested_quantity;
        const remaining = approvedQty - (it.issued_quantity || 0);
        return {
          material_id: it.material_id,
          material_name: it.material_name,
          material_code: it.material_code,
          warehouse_id: it.warehouse_id,
          warehouse_name: it.warehouse_name,
          uom_name: it.uom_name,
          approved: approvedQty,
          issued: it.issued_quantity || 0,
          remaining: remaining,
          in_stock: it.current_stock || 0,
          issue_qty: ''
        };
      })
      .filter(it => it.remaining > 0);
    setIssueModal({ open: true, isDirect: false, indent, items, project_id: indent.project_id || '', warehouse_id: items[0]?.warehouse_id || '', remarks: '' });
  };

  const openDirectIssueModal = () => {
    setBuildings([]);
    setFloors([]);
    setRooms([]);
    setIssueModal({
      open: true,
      isDirect: true,
      indent: null,
      project_id: '',
      warehouse_id: warehouses[0]?.id || '',
      department: '', building_id: '', floor_id: '', room_id: '',
      remarks: '',
      items: [{ material_id: '', issue_qty: '' }]
    });
  };

  const openViewIssueModal = (issue) => {
    setViewIssueModal({ open: true, issue });
  };

  const handleIssueSubmit = async () => {
    try {
      if (issueModal.isDirect && (!issueModal.warehouse_id || !issueModal.project_id || !issueModal.department)) {
        showMessage('Please select a warehouse, institution and department for direct issue.', 'Validation Error', 'warning');
        return;
      }
      const validItems = issueModal.items.filter(it => it.material_id && it.issue_qty > 0);
      if (validItems.length === 0) {
        showMessage('Please provide quantity for at least one item.', 'Validation Error', 'warning');
        return;
      }

      const payload = {
        warehouse_id: issueModal.isDirect ? issueModal.warehouse_id : issueModal.items[0]?.warehouse_id,
        project_id: issueModal.isDirect ? issueModal.project_id : (issueModal.indent?.project_id || 1),
        indent_id: issueModal.indent?.id,
        issued_to_department: issueModal.isDirect ? issueModal.department : undefined,
        building_id: issueModal.isDirect ? issueModal.building_id : undefined,
        issued_to_room_id: issueModal.isDirect ? (issueModal.room_id || null) : issueModal.indent?.room_id,
        purpose: issueModal.remarks || (issueModal.isDirect ? 'Direct Issue' : `Fulfillment for ${issueModal.indent?.indent_number}`),
        items: validItems.map(it => ({
          material_id: it.material_id,
          quantity: parseFloat(it.issue_qty)
        }))
      };
      const res = await api.post('/api/issues', payload);
      setIssueModal({ ...issueModal, open: false });
      load();
      const issueNum = res.data?.issue_number;
      showMessage(issueNum ? `Material ${issueNum} issued successfully!` : 'Material issued successfully!', 'Success', 'success');
    } catch (err) {
      let detail = err.response?.data?.detail || 'Error';
      if (Array.isArray(detail)) {
          detail = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'object') {
          detail = detail.msg || JSON.stringify(detail);
      }
      
      if (typeof detail === 'string' && detail.includes('limit per month')) {
        showMessage(detail, "Limit Reached", "warning");
      } else {
        showMessage(detail, "Error", "error");
      }
    }
  };

  const addDirectItem = () => {
    const emptyCount = issueModal.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", "Limit Reached", "warning");
      return;
    }
    setIssueModal({
      ...issueModal,
      items: [...issueModal.items, { material_id: '', issue_qty: '' }]
    });
  };

  const removeDirectItem = (index) => {
    const newItems = [...issueModal.items];
    newItems.splice(index, 1);
    setIssueModal({ ...issueModal, items: newItems });
  };

  const updateDirectItem = (index, field, value) => {
    const newItems = [...issueModal.items];
    newItems[index][field] = value;
    setIssueModal({ ...issueModal, items: newItems });
  };

  const handleRowClick = (row) => {
    if (row.type === 'indent') {
      openIssueModal(row);
    } else {
      openViewIssueModal(row);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Material Issues</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Manage central store fulfillment, track pending indents, and log direct issues.</Typography>
          </Box>
        </Box>

        {hasAction('issues', 'can_direct_issue') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openDirectIssueModal}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
          >
            New Issue
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by Record No (e.g. IND-0001)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'white', borderRadius: 1, minWidth: 300, width: '100%', maxWidth: 400 }}
        />
        <Autocomplete
          size="small"
          options={projects}
          getOptionLabel={(option) => option.name || ''}
          value={filterInstitution}
          onChange={(e, val) => setFilterInstitution(val)}
          renderInput={(params) => <TextField {...params} placeholder="Filter by Institution" sx={{ minWidth: 250 }} />}
          sx={{ bgcolor: 'white', borderRadius: 1 }}
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {['Pending', 'Partial', 'Completed', 'Acknowledged', 'All'].map(s => {
            const count = s === 'All' ? combinedList.length : combinedList.filter(i => i.derivedStatus === s).length;
            if (s !== 'All' && count === 0) return null;
            return (
              <Tab
                key={s}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s}
                    <Chip
                      label={count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: tabValue === s ? 'primary.main' : 'action.selected', color: tabValue === s ? 'white' : 'text.primary' }}
                    />
                  </Box>
                }
                value={s}
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
              />
            )
          })}
        </Tabs>
      </Card>

      {filteredList.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <Inventory2 sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Issue Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Pending indents and completed issues will appear here.</Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <TableContainer>
            <Table size="small" aria-label="issues table">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, py: 1.5 }}>
                    <TableSortLabel active={sortConfig.key === 'idStr'} direction={sortConfig.key === 'idStr' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('idStr')}>RECORD NO.</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel active={sortConfig.key === 'sortDate'} direction={sortConfig.key === 'sortDate' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('sortDate')}>DATE</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel active={sortConfig.key === 'institutionName'} direction={sortConfig.key === 'institutionName' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('institutionName')}>INSTITUTION</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel active={sortConfig.key === 'personStr'} direction={sortConfig.key === 'personStr' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('personStr')}>ISSUED TO</TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel active={sortConfig.key === 'itemCount'} direction={sortConfig.key === 'itemCount' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('itemCount')}>ITEMS</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleRequestSort('status')}>STATUS</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredList.map((row, index) => {
                  const isIndent = row.type === 'indent';
                  const idStr = row.idStr;
                  const personStr = row.personStr;
                  const itemCount = row.itemCount;

                  let statusColor = 'default';
                  let statusLabel = row.derivedStatus;
                  if (isIndent) {
                    if (statusLabel === 'Pending') { statusColor = 'primary'; }
                    if (statusLabel === 'Partial') { statusColor = 'warning'; }
                  } else {
                    if (statusLabel === 'Acknowledged') { statusColor = 'success'; }
                    else { statusColor = 'success'; }
                  }

                  return (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', px: 2 }}>{idStr}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{formatDate(row.created_at)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>{row.institutionName}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>{personStr}</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', px: 2 }}>
                        {row.derivedStatus === 'Partial' && row.pendingItemCount > 0 ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip label={`Total: ${itemCount}`} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', bgcolor: '#F1F5F9', color: '#475569' }} />
                            <Chip label={`Pending: ${row.pendingItemCount}`} size="small" color="error" variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                          </Box>
                        ) : (
                          <Chip label={itemCount} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', bgcolor: '#F1F5F9', color: '#475569' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ px: 2 }}>
                        <Chip label={statusLabel} size="small" color={statusColor} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                        {row.derivedStatus === 'Acknowledged' && row.acknowledgedByName && (
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.6rem', color: '#64748B' }}>By {row.acknowledgedByName}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ px: 2, whiteSpace: 'nowrap' }}>
                        <Tooltip title={isIndent ? "Issue Materials" : "Issue Completed"}>
                          <IconButton
                            size="small"
                            disabled={!isIndent}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isIndent) openIssueModal(row);
                            }}
                            sx={{ color: isIndent ? '#2563EB' : 'action.disabled' }}
                          >
                            <Outbox fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ISSUE MATERIALS MODAL */}
      <Dialog open={issueModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setIssueModal({ ...issueModal, open: false }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <Inventory2 fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {issueModal.isDirect ? 'Direct Material Issue' : 'Issue Materials for Indent'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {issueModal.isDirect ? 'Issue items directly without an indent' : (
                    <>
                      {issueModal.indent?.indent_number}
                      {(() => {
                        const ind = issueModal.indent;
                        if (!ind) return '';
                        const loc = [ind.building_name, ind.floor, ind.room_name].filter(Boolean).join('-');
                        const dept = ind.department;
                        const inst = ind.institution_name || ind.project_name;
                        
                        let formattedLoc = '';
                        if (inst && dept) {
                           formattedLoc = `${inst} - ${dept}`;
                        } else {
                           formattedLoc = inst || dept || '';
                        }
                        
                        if (loc) {
                           formattedLoc += ` (${loc})`;
                        }
                        
                        return formattedLoc ? ` • Issued to: ${formattedLoc}` : '';
                      })()}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>

          {issueModal.isDirect && (
            <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source Store <span style={{ color: '#d32f2f' }}>*</span></InputLabel>
                  <Select
                    label="Source Store *"
                    value={issueModal.warehouse_id}
                    onChange={e => setIssueModal({ ...issueModal, warehouse_id: e.target.value })}
                    startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  >
                    {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Institution <span style={{ color: '#d32f2f' }}>*</span></InputLabel>
                  <Select
                    label="Institution *"
                    value={issueModal.project_id || ''}
                    onChange={e => setIssueModal({ ...issueModal, project_id: e.target.value })}
                    startAdornment={<InputAdornment position="start"><Business sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  >
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={departmentsList}
                  value={issueModal.department || null}
                  onChange={(e, val) => handleDepartmentChange(val)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label={<>Department <span style={{ color: '#d32f2f' }}>*</span></>} InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', ml: 1, fontSize: 18 }} /></InputAdornment>{params.InputProps.startAdornment}</> }} sx={{ bgcolor: '#fff' }} />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Building</InputLabel>
                  <Select
                    label="Building"
                    value={issueModal.building_id || ''}
                    onChange={e => handleBuildingChange(e.target.value)}
                    disabled={!issueModal.department || buildings.length === 0}
                    sx={{ bgcolor: '#fff' }}
                    startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                  >
                    <MenuItem value="" disabled><em>Select Building</em></MenuItem>
                    {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Floor</InputLabel>
                  <Select
                    label="Floor"
                    value={issueModal.floor_id || ''}
                    onChange={e => handleFloorChange(e.target.value)}
                    disabled={!issueModal.building_id || floors.filter(f => f.building_id === issueModal.building_id).length === 0}
                    sx={{ bgcolor: '#fff' }}
                    startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                  >
                    <MenuItem value="" disabled><em>Select Floor</em></MenuItem>
                    {floors.filter(f => !issueModal.building_id || f.building_id === issueModal.building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Room</InputLabel>
                  <Select
                    label="Room"
                    value={issueModal.room_id || ''}
                    onChange={e => setIssueModal({ ...issueModal, room_id: e.target.value })}
                    disabled={!issueModal.floor_id || rooms.filter(rm => rm.floor_id === issueModal.floor_id).length === 0}
                    sx={{ bgcolor: '#fff' }}
                    startAdornment={<InputAdornment position="start"><MeetingRoom sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                  >
                    <MenuItem value="" disabled><em>Select Room</em></MenuItem>
                    {rooms.filter(rm => !issueModal.floor_id || rm.floor_id === issueModal.floor_id).map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {issueModal.isDirect && (
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Items to Issue</Typography>
              <Button size="small" startIcon={<Add />} onClick={addDirectItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM</TableCell>
                  {!issueModal.isDirect && <TableCell sx={{ fontWeight: 700 }}>SOURCE STORE</TableCell>}
                  {!issueModal.isDirect && <TableCell align="center" sx={{ fontWeight: 700 }}>APPROVED</TableCell>}
                  {!issueModal.isDirect && <TableCell align="center" sx={{ fontWeight: 700 }}>REMAINING</TableCell>}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>IN STOCK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 120 }}>ISSUE QTY</TableCell>
                  {issueModal.isDirect && <TableCell align="center" sx={{ width: '5%' }}></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {issueModal.items.map((it, i) => {
                  let inStock = 0;
                  if (issueModal.isDirect) {
                    inStock = Math.round(stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0);
                  } else {
                    inStock = Math.round(stocks.find(s => s.warehouse_id === it.warehouse_id && s.material_id === it.material_id)?.quantity || 0);
                  }
                  const maxQty = issueModal.isDirect ? inStock : Math.min(it.remaining, inStock);

                  return (
                    <TableRow key={i}>
                      <TableCell>
                        {issueModal.isDirect ? (
                          <MaterialSelect
                            materials={materials.filter(m => !issueModal.items.some((it, idx) => idx !== i && it.material_id === m.id))}
                            value={it.material_id}
                            onChange={(val) => updateDirectItem(i, 'material_id', val)}
                          />
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>{it.material_code}</Typography>
                          </>
                        )}
                      </TableCell>
                      {!issueModal.isDirect && (
                        <TableCell>
                          <Chip
                            label={it.warehouse_name || 'Mapped Store'}
                            size="small"
                            sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                      )}
                      {!issueModal.isDirect && <TableCell align="center">{it.approved}</TableCell>}
                      {!issueModal.isDirect && <TableCell align="center" sx={{ color: '#1E40AF', fontWeight: 600 }}>{it.remaining}</TableCell>}
                      <TableCell align="center" sx={{ fontWeight: 700, color: inStock > 0 ? '#059669' : '#DC2626' }}>
                        {it.material_id ? inStock : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ 
                            step: (it.material_id && materials.find(m => m.id === it.material_id)?.uom_allow_decimal) ? "any" : "1", 
                            min: "0", 
                            max: String(maxQty) 
                          }}
                          onKeyDown={e => {
                            const mat = it.material_id ? materials.find(m => m.id === it.material_id) : null;
                            const allowDec = mat ? mat.uom_allow_decimal : false;
                            const blockList = ['-', '+', 'e', 'E'];
                            if (!allowDec) blockList.push('.');
                            if (blockList.includes(e.key)) e.preventDefault();
                          }}
                          value={it.issue_qty}
                          disabled={inStock <= 0 || !it.material_id}
                          onChange={e => {
                            const mat = it.material_id ? materials.find(m => m.id === it.material_id) : null;
                            const allowDec = mat ? mat.uom_allow_decimal : false;
                            const newItems = [...issueModal.items];
                            let valStr = e.target.value.replace(/-/g, '');
                            if (!allowDec) valStr = valStr.replace(/\./g, '');
                            if (valStr === '') {
                              newItems[i].issue_qty = '';
                            } else {
                              const val = parseFloat(valStr) || 0;
                              newItems[i].issue_qty = Math.max(0, Math.min(val, maxQty));
                            }
                            setIssueModal({ ...issueModal, items: newItems });
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      {issueModal.isDirect && (
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => removeDirectItem(i)} disabled={issueModal.items.length === 1}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField inputProps={{ maxLength: 255 }}
            fullWidth size="small" label="Remarks"
            value={issueModal.remarks}
            onChange={e => setIssueModal({ ...issueModal, remarks: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, border: '1px solid #FEF3C7' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="small" /> Confirmation required
            </Typography>
            <Typography variant="caption" color="#92400E">Review the issue quantities carefully before proceeding. Stock will be instantly deducted.</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleIssueSubmit} variant="contained" color="error" disabled={issueModal.items.every(it => it.issue_qty <= 0)} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)', textTransform: 'none' }}>Confirm Issue</Button>
        </DialogActions>
      </Dialog>

      {/* VIEW COMPLETED ISSUE MODAL */}
      <Dialog open={viewIssueModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setViewIssueModal({ open: false, issue: null }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewIssueModal.issue && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Issue Details - {viewIssueModal.issue.issue_number}</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(viewIssueModal.issue.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Issued By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewIssueModal.issue.issued_by_name || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Project</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewIssueModal.issue.project_name || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewIssueModal.issue.is_acknowledged ? 'Acknowledged' : 'Completed'}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                    />
                    {viewIssueModal.issue.is_acknowledged && viewIssueModal.issue.acknowledged_by_name && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem', color: '#64748B' }}>By {viewIssueModal.issue.acknowledged_by_name}</Typography>
                    )}
                  </Box>
                </Grid>
                {viewIssueModal.issue.purpose && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Purpose / Remarks</Typography>
                    <Typography variant="body2">{viewIssueModal.issue.purpose}</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>Issued Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ISSUED FROM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>ISSUED QTY</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewIssueModal.issue.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{item.material_name}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontFamily: 'monospace' }}>{item.material_code}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{item.warehouse_name || 'Central Store'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity} {item.uom_name || 'unit'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 4, pb: 4 }}>
              <Button onClick={() => setViewIssueModal({ open: false, issue: null })} sx={{ color: '#64748B' }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
