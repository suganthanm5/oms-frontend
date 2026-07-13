import apiClient from '../api/apiClient';

export const stockService = {
  /** Get stock for a specific outlet */
  getByOutlet: async (outletId, params = {}, signal) => {
    const res = await apiClient.get(`/api/stock/outlet/${outletId}`, { params, signal });
    return res.data?.data;
  },

  /** Get all stock entries */
  getAll: async (params = {}, signal) => {
    const res = await apiClient.get('/api/stock', { params, signal });
    return res.data?.data;
  },

  /** Transfer stock between outlets */
  transfer: async (data) => {
    // data: { fromOutletId, outletId (toOutletId), productId, batchId, quantity }
    const res = await apiClient.post('/api/stock/transfer', data);
    return res.data?.data || res.data;
  },

  /** Get transaction history */
  getTransactions: async (params = {}, signal) => {
    const res = await apiClient.get('/api/stock/transactions', { params, signal });
    return res.data?.data;
  },

  /** Get transaction stats */
  getStats: async (params = {}, signal) => {
    const res = await apiClient.get('/api/stock/transactions/stats', { params, signal });
    return res.data?.data || { totalIn: 0, totalOut: 0 };
  },
};
