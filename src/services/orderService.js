import apiClient from '../api/apiClient';

export const orderService = {
  /** Get all orders */
  getAll: async (params = {}, signal) => {
    const res = await apiClient.get('/api/orders', { params, signal });
    return res.data?.data;
  },

  /** Get single order */
  getById: async (id) => {
    const res = await apiClient.get(`/api/orders/${id}`);
    return res.data?.data || res.data;
  },

  /** Get order counts */
  getCounts: async (params = {}) => {
    const res = await apiClient.get('/api/orders/counts', { params });
    return res.data?.data || {};
  },

  /** Create order */
  create: async (data) => {
    const formatted = {
      outletId: data.outletId,
      remarks: data.remarks || "",
      items: data.items.map(it => ({
        productId: it.productId,
        ...(it.batchId ? { batchId: Number(it.batchId) } : {}),
        quantity: Number(it.quantity),
        remarks: it.remarks || ""
      }))
    };
    const res = await apiClient.post('/api/orders', formatted);
    return res.data?.data || res.data;
  },

  /** Update order status */
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/api/orders/${id}/status?status=${status}`);
    if (res.status >= 400) throw { response: res };
    return res.data?.data || res.data;
  },

  /** Delete order */
  delete: async (id) => {
    await apiClient.delete(`/api/orders/${id}`);
  },
};
