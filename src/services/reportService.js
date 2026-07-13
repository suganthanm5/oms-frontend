import API from '../api/apiClient';

export const reportService = {
  getDashboardSummary: async () => {
    const res = await API.get('/api/reports/dashboard-summary');
    return res.data?.data;
  },
  
  getStockSummary: async () => {
    const res = await API.get('/api/reports/stock-summary');
    return res.data?.data;
  },
  
  getExpiringBatches: async () => {
    const res = await API.get('/api/reports/expiring-batches');
    return res.data?.data;
  },
  
  getTransactions: async (params) => {
    const res = await API.get('/api/reports/transactions', { params });
    return res.data?.data;
  }
};
