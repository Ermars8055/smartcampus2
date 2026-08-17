import api from './api';

const VENDOR_WORK_ORDERS_API = '/api/vendor-work-orders';

export const getVendorWorkOrders = async (params) => {
  const response = await api.get(VENDOR_WORK_ORDERS_API, { params });
  return response.data;
};

export const getVendorWorkOrder = async (id) => {
  const response = await api.get(`${VENDOR_WORK_ORDERS_API}/${id}`);
  return response.data;
};

export const createVendorWorkOrder = async (data) => {
  const response = await api.post(VENDOR_WORK_ORDERS_API, data);
  return response.data;
};

export const updateVendorWorkOrder = async (id, data) => {
  const response = await api.put(`${VENDOR_WORK_ORDERS_API}/${id}`, data);
  return response.data;
};

export default {
  getVendorWorkOrders,
  getVendorWorkOrder,
  createVendorWorkOrder,
  updateVendorWorkOrder,
};
