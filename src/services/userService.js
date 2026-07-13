import apiClient from '../api/apiClient';

export const userService = {
  getAllUsers: async (page = 0, size = 10, search = "", signal) => {
    const params = { page, size, ...(search ? { search } : {}) };
    const response = await apiClient.get(`/api/users`, { params, signal });
   
    const pageData = response.data?.data;
    return pageData || { content: [], totalElements: 0, totalPages: 0 };
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/api/users', userData);
    return response.data?.data || response.data;
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/api/users/${id}`, userData);
    return response.data?.data || response.data;
  },
  
  updateUserRole: async (id, role) => {
    const response = await apiClient.patch(`/api/users/${id}/role?role=${role}`);
    return response.data?.data || response.data;
  },

  deleteUser: async (id) => {
    await apiClient.delete(`/api/users/${id}`);
  },

  assignRoles: async (id, roles) => {
    const response = await apiClient.post(`/api/users/${id}/roles`, roles);
    return response.data?.data || response.data;
  },

  impersonateUser: async (id) => {
    const response = await apiClient.post(`/api/users/${id}/impersonate`);
    return response.data?.data || response.data;
  }
};
