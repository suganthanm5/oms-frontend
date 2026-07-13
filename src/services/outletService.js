import API, { ENDPOINTS } from '../api/apiClient';

const getOutlets = async (page = 0, size = 10, search = "", filters = {}, signal) => {
  const params = { page, size, ...(search ? { search } : {}), ...filters };
  const res = await API.get(ENDPOINTS.outlets, { params, signal });
  const pageData = res.data?.data;
  return pageData || { content: [], totalPages: 0, totalElements: 0 };
};

const createOutlet = async (data) => {
  const res = await API.post(ENDPOINTS.outlets, data);
  return res.data?.data || res.data;
};

const updateOutlet = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.outlets}/${id}`, data);
  return res.data?.data || res.data;
};

const deleteOutlet = async (id) => {
  await API.delete(`${ENDPOINTS.outlets}/${id}`);
};

const bulkCreateOutlets = async (rows) => {
  const res = await API.post(`${ENDPOINTS.outlets}/bulk`, rows);
  const result = res.data?.data;
  return (result?.results || []).map((r) => ({
    name: r.name,
    success: r.success,
    error: r.error || "",
  }));
};

export const outletService = {
    getAll: getOutlets,
    getOutlets,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    bulkCreateOutlets,
};

export { getOutlets, createOutlet, updateOutlet, deleteOutlet, bulkCreateOutlets };
