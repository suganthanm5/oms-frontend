import API, { ENDPOINTS } from './apiClient';

// User API service with proper authentication
const userService = {
  // Get user profile based on authenticated user
  getProfile: async () => {
    try {
      const response = await API.get(ENDPOINTS.profile);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to load user profile from database:', error);
      throw new Error(`Failed to load profile: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update user profile in database
  updateProfile: async (profileData) => {
    try {
      const response = await API.put(ENDPOINTS.profile, profileData);
      
      return {
        success: true,
        message: 'Profile updated successfully in database',
        user: response.data?.data || response.data
      };
    } catch (error) {
      console.error('Failed to update profile in database:', error);
      throw new Error(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    }
  },

  // Change password in database
  changePassword: async (passwordData) => {
    const response = await API.put(ENDPOINTS.changePassword, passwordData);
    return response.data?.data || response.data;
  },

  // Upload profile picture to database
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await API.post(ENDPOINTS.uploadPicture, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Failed to upload profile picture to database:', error);
      throw new Error(`Failed to upload picture: ${error.response?.data?.message || error.message}`);
    }
  }
};

export default userService;