import API, { ENDPOINTS } from '../api/apiClient';


const mapDivisionResponse = (division) => {
  if (!division) return null;
  return {
    id: division.id,
    name: division.name,
    products: Array.isArray(division.products) ? division.products : [],
    createdAt: division.createdAt,
    updatedAt: division.updatedAt,
    createdBy: division.createdBy,
    updatedBy: division.updatedBy,
  };
};


const getDivisions = async (page = 0, size = 10, keyword = "", minProducts = null, maxProducts = null, daysAgo = null, signal) => {
  try {
    const params = { page, size };
    if (keyword) params.keyword = keyword;
    if (minProducts !== null && minProducts !== undefined && minProducts !== "") params.minProducts = minProducts;
    if (maxProducts !== null && maxProducts !== undefined && maxProducts !== "") params.maxProducts = maxProducts;
    if (daysAgo !== null && daysAgo !== undefined && daysAgo !== "") params.daysAgo = daysAgo;
    
    const res = await API.get(ENDPOINTS.divisions, { 
      params, 
      signal 
    });
    
    const pageData = res.data?.data;
    
    if (!pageData) {
      return { content: [], totalPages: 0, totalElements: 0 };
    }
    
    // Map all divisions in content array
    const mappedContent = (pageData.content || []).map(mapDivisionResponse);
    
    return {
      content: mappedContent,
      totalPages: pageData.totalPages || 0,
      totalElements: pageData.totalElements || 0,
      currentPage: pageData.currentPage || page,
      pageSize: pageData.pageSize || size,
    };
  } catch (error) {
    if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
      console.error('getDivisions error:', error);
    }
    throw error;
  }
};


const createDivision = async (data) => {
  const res = await API.post(ENDPOINTS.divisions, data);
  const divisionData = res.data?.data || res.data;
  return mapDivisionResponse(divisionData);
};


const updateDivision = async (id, data) => {
  const res = await API.put(`${ENDPOINTS.divisions}/${id}`, data);
  const divisionData = res.data?.data || res.data;
  return mapDivisionResponse(divisionData);
};


const deleteDivision = async (id) => {
  await API.delete(`${ENDPOINTS.divisions}/${id}`);
};


const getDivisionById = async (id, signal) => {
  try {
    const res = await API.get(`${ENDPOINTS.divisions}/${id}`, { signal });
    const divisionData = res.data?.data || res.data;
    return mapDivisionResponse(divisionData);
  } catch (error) {
    console.error('getDivisionById error:', error);
    throw error;
  }
};

const bulkCreateDivisions = async (names) => {
  const res = await API.post(`${ENDPOINTS.divisions}/bulk`, names.map((name) => ({ name })));
  const result = res.data?.data;
  return (result?.results || []).map((r) => ({
    name: r.name,
    success: r.success,
    error: r.error || "",
  }));
};

export { getDivisions, createDivision, updateDivision, deleteDivision, getDivisionById, mapDivisionResponse, bulkCreateDivisions };
