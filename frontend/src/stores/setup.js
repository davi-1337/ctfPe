import { defineStore } from 'pinia';
import apiClient from '@/api/axios.config';

export const useSetupStore = defineStore('setup', {
  state: () => ({
    isCompleted: null,
    isLoading: false,
    error: null,
  }),
  
  getters: {
    isSetupRequired: (state) => state.isCompleted === false,
    isSetupDone: (state) => state.isCompleted === true,
  },
  
  actions: {
    async fetchSetupStatus() {
      if (this.isCompleted !== null) return;

      this.isLoading = true;
      this.error = null;
      
      try {
        const response = await apiClient.get('/setup/status'); 
        this.isCompleted = response.data.setup_completed;

      } catch (error) {
        this.error = 'Failed to connect to backend setup endpoint.';
        this.isCompleted = false; 
      } finally {
        this.isLoading = false;
      }
    },
    
    markSetupAsComplete() {
        this.isCompleted = true;
    }
  },
});