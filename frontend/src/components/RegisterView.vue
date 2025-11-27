<template>
  <div class="setup-container">
    <div class="card">
      <h2 class="text-center">Register</h2>

      <div v-if="errorMessage" class="alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister">
        <BaseInput
          id="username"
          label="Username"
          v-model="form.username"
          placeholder="Choose a username"
          required
        />

        <BaseInput
          id="password"
          label="Password"
          type="password"
          v-model="form.password"
          placeholder="Choose a password"
          required
        />

        <BaseInput
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          v-model="form.confirmPassword"
          placeholder="Repeat password"
          required
        />

        <BaseButton type="submit" :loading="loading">
          Create Account
        </BaseButton>

        <div class="text-center" style="margin-top: 15px;">
          <router-link to="/login" style="color: var(--primary-color);">
            Already have an account? Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api/axios.config';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();

const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

const handleRegister = async () => {
  errorMessage.value = '';

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  loading.value = true;

  try {
    await apiClient.post('/auth/register', {
      username: form.username,
      password: form.password
    });

    router.push('/login');
    
  } catch (error) {
    if (error.response?.status === 409) {
      errorMessage.value = 'Username already exists.';
    } else {
      errorMessage.value = error.response?.data?.error || 'Registration failed.';
    }
  } finally {
    loading.value = false;
  }
};
</script>