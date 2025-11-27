<template>
  <div>
    <TheNavbar />

    <div v-if="loading" class="flex-center">
      <p>Loading CTF configuration...</p>
    </div>

    <HeroSection 
      v-else
      :title="ctfData.ctf_name" 
      :start="ctfData.ctf_start" 
      :end="ctfData.ctf_end"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiClient from '@/api/axios.config';

// Import Submodules
import TheNavbar from '@/components/TheNavbar.vue';
import HeroSection from '@/components/HeroSection.vue';

const loading = ref(true);
const ctfData = ref({
  ctf_name: '',
  ctf_start: null,
  ctf_end: null
});

onMounted(async () => {
  try {
    // Calls the /settings endpoint defined in backend/src/routes/ctf.js
    const response = await apiClient.get('/ctf/settings');
    ctfData.value = response.data;
  } catch (error) {
    console.error('Connection error:', error);
    ctfData.value.ctf_name = 'Error loading CTF data';
  } finally {
    loading.value = false;
  }
});
</script>