import { defineStore } from 'pinia';
import apiClient from '@/api/axios.config';

const EXPIRY_DURATION = 3600000; 

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') || null,
    user: JSON.parse(localStorage.getItem('user_info')) || null,
    isAdmin: localStorage.getItem('user_role') === 'admin',
    loginTime: parseInt(localStorage.getItem('login_time')) || null,
    expiresAt: parseInt(localStorage.getItem('expires_at')) || null,
  }),
  
  getters: {
    isTokenExpired: (state) => {
        if (!state.expiresAt) return true;
        return Date.now() >= state.expiresAt;
    },
    isAuthenticated: (state) => {
        if (!state.token) return false;
        
  
        const authStore = useAuthStore();
        

        if (authStore.isTokenExpired) {
            authStore.logout(); 
            return false;
        }
        return true;
    },
    isAdminUser: (state) => state.isAdmin,
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await apiClient.post('/auth/login', { username, password });
        
        const { token, role, user } = response.data;


        const now = Date.now();
        const expirationTime = now + EXPIRY_DURATION; 


        this.token = token;
        this.user = user;
        this.isAdmin = role === 'admin';
        this.loginTime = now;
        this.expiresAt = expirationTime;

        
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('user_info', JSON.stringify(user));
        localStorage.setItem('user_role', role);
        localStorage.setItem('login_time', now.toString());
        localStorage.setItem('expires_at', expirationTime.toString());
        
        return true;
      } catch (error) {
        this.logout();
        return false;
      }
    },
    
    logout() {
      // 1. clear state
      this.token = null;
      this.user = null;
      this.isAdmin = false;
      this.loginTime = null;
      this.expiresAt = null;
      
      // 2. clear localStorage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_role');
      localStorage.removeItem('login_time');
      localStorage.removeItem('expires_at');
    }
  },
});