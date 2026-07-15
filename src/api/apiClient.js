import axios from 'axios';
import { setupInterceptors } from './interceptors';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin,
  timeout: 30000,
});

setupInterceptors(API);

export const ENDPOINTS = {
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  validate: '/api/v1/auth/validate',
  profile: '/api/users/profile',
  changePassword: '/api/users/change-password',
  uploadPicture: '/api/users/upload-picture',
  products: '/api/products',
  divisions: '/api/divisions',
  outlets: '/api/outlets',
  locations: '/api/locations',
};

export default API;
