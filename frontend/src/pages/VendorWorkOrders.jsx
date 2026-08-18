import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import vendorWorkOrderService from '../services/vendorWorkOrderService';
import { formatDate } from '../utils/dateUtils';

const VendorWorkOrders = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await vendorWorkOrderService.getVendorWorkOrders({});
      setWorkOrders(data);
    } catch (error) {
      console.error('Error fetching vendor work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Approved': return 'info';
      case 'Sent to Vendor': return 'primary';
      case 'Accepted': return 'secondary';
      case 'Work In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Verified': return 'success';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Vendor Work Orders</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/procurement/vendor-work-orders/new')}
          sx={{ borderRadius: 2 }}
        >
          Create Vendor Work Order
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'background.default' }}>
              <TableRow>
                <TableCell>VWO No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workOrders.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No vendor work orders found</Typography>
                  </TableCell>
                </TableRow>
              )}
              {workOrders.map((wo) => (
                <TableRow key={wo.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{wo.vwo_number}</TableCell>
                  <TableCell>{formatDate(wo.created_at)}</TableCell>
                  <TableCell>{wo.vendor_name}</TableCell>
                  <TableCell>{wo.equipment_code}</TableCell>
                  <TableCell>
                    <Chip 
                      label={wo.priority} 
                      size="small" 
                      color={wo.priority === 'High' || wo.priority === 'Critical' ? 'error' : 'default'}
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">₹ {Number(wo.total_approved_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={wo.status}
                      size="small"
                      color={getStatusColor(wo.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/procurement/vendor-work-orders/${wo.id}`)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default VendorWorkOrders;
