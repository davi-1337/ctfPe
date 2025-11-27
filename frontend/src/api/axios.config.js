// src/api/axios.config.js

import axios from 'axios';
import { useAuthStore } from '@/stores/auth'; 
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3000';
/**
 * 
 * function for baseurl 
 * 
 */
const getBaseUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const backendPort = BACKEND_PORT; 
  
  return `${protocol}//${hostname}:${backendPort}`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(), 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // sei la pq funfa assim
    const authStore = useAuthStore();
    const token = authStore.token; 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; 
    }
    
    return config;
  }, 
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;