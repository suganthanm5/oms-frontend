import API, { ENDPOINTS } from '../api/apiClient';

export const loginUser = async (data) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit'
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      };
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    if (error.response) {
      throw error;
    }
    console.error('Direct fetch failed, trying axios:', error.message);
    return API.post(ENDPOINTS.login, data);
  }
};

export const registerUser = (data) => API.post(ENDPOINTS.register, data);
export const validateToken = () => API.get(ENDPOINTS.validate);
