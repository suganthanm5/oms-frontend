import API, { ENDPOINTS } from '../api/apiClient';

const getProducts = async (page = 0, size = 10, search = "", filters = {}, signal) => {
  const params = { page, size, ...(search ? { search } : {}), ...filters };
  const res = await API.get(ENDPOINTS.products, { params, signal });
  const pageData = res.data?.data;
  return pageData || { content: [], totalPages: 0, totalElements: 0 };
};

const getProductsByDivision = (divisionId, signal) => 
  API.get(`${ENDPOINTS.divisions}/${divisionId}`, { signal })
    .then(res => {
      const divData = res.data?.data;
      return { data: divData?.products || [] };
    });

const createProduct = (divisionId, data) => 
  API.post(ENDPOINTS.products, { ...data, divisionId, division: { id: divisionId } });

const addProduct = (data) => API.post(ENDPOINTS.products, data);

const updateProduct = (id, data) => API.put(`${ENDPOINTS.products}/${id}`, data);

const deleteProduct = (id) => API.delete(`${ENDPOINTS.products}/${id}`);

const bulkCreateProducts = async (rows) => {
  const res = await API.post(`${ENDPOINTS.products}/bulk`, rows);
  const result = res.data?.data;
  return (result?.results || []).map((r) => ({
    name: r.name,
    success: r.success,
    error: r.error || "",
  }));
};

export const productService = {
    getAll: getProducts,
    getProducts,
    getProductsByDivision,
    createProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
};

export {
  getProducts,
  getProductsByDivision,
  createProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
};
