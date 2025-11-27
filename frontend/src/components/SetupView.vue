<template>
  <div class="setup-container">
    <div class="card">
      <h2>CTFPe Setup</h2>
      
      <div v-if="errorMessage" class="alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSetup">
        <BaseInput
          id="ctf_name"
          label="CTF Name"
          v-model="form.ctf_name"
          placeholder="e.g. My CTF Event"
          required
        />

        <BaseInput
          id="duration"
          label="Duration (Days)"
          type="number"
          v-model="form.duration_days"
          placeholder="7"
        />

        <BaseInput
          id="username"
          label="Admin Username"
          v-model="form.username"
          placeholder="admin"
          required
        />

        <BaseInput
          id="password"
          label="Admin Password"
          type="password"
          v-model="form.password"
          placeholder="Min 8 characters"
          required
        />

        <BaseButton type="submit" :loading="loading">
          Finish Setup
        </BaseButton>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSetupStore } from '@/stores/setup';
import apiClient from '@/api/axios.config';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const setupStore = useSetupStore();

const loading = ref(false);
const errorMessage = ref('');

// Form state
const form = reactive({
  username: '',
  password: '',
  ctf_name: '',
  duration_days: 7 // Default value
});

// Check status on mount
onMounted(async () => {
  if (setupStore.isCompleted === null) {
    await setupStore.fetchSetupStatus();
  }

  // If already done, redirect to Home
  if (setupStore.isSetupDone) {
    router.push('/');
  }
});

const handleSetup = async () => {
  errorMessage.value = '';
  
  if (form.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long.';
    return;
  }

  loading.value = true;

  try {
    // POST to /setup
    const response = await apiClient.post('/setup', {
      username: form.username,
      password: form.password,
      ctf_name: form.ctf_name,
      duration_days: form.duration_days
    });

    if (response.status === 201) {
      setupStore.markSetupAsComplete();
      // Redirect to login because setup does not return JWT
      router.push('/login'); 
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage.value = error.response.data.message || error.response.data.error;
    } else {
        errorMessage.value = 'An error occurred while connecting to the server.';
    }
  } finally {
    loading.value = false;
  }
};
</script>