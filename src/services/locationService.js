import API, { ENDPOINTS } from '../api/apiClient';

const getLocations = async (page = 0, size = 10, search = "", signal) => {
  const res = await API.get(ENDPOINTS.locations, { params: { page, size, ...(search ? { search } : {}) }, signal });
  // Return the paginated wrapper { content, totalPages, totalElements, etc }
  return res.data?.data || [];
};

const createLocation = async (data) => {
  const res = await API.post(ENDPOINTS.locations, data);
  return res.data?.data || res.data;
};

const updateLocation = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.locations}/${id}`, data);
  return res.data?.data || res.data;
};

const deleteLocation = async (id) => {
  await API.delete(`${ENDPOINTS.locations}/${id}`);
};

const bulkCreateLocations = async (names) => {
  const res = await API.post(`${ENDPOINTS.locations}/bulk`, names.map((name) => ({ name })));
  const result = res.data?.data;
  return (result?.results || []).map((r) => ({
    name: r.name,
    success: r.success,
    error: r.error || "",
  }));
};

export { getLocations, createLocation, updateLocation, deleteLocation, bulkCreateLocations };
