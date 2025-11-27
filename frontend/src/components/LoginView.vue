<template>
  <div class="setup-container">
    <div class="card">
      <h2 class="text-center">Login</h2>

      <div v-if="errorMessage" class="alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin">
        <BaseInput
          id="username"
          label="Username"
          v-model="form.username"
          placeholder="Enter your username"
          required
        />

        <BaseInput
          id="password"
          label="Password"
          type="password"
          v-model="form.password"
          placeholder="Enter your password"
          required
        />

        <BaseButton type="submit" :loading="loading">
          Sign In
        </BaseButton>

        <div class="text-center" style="margin-top: 15px;">
          <router-link to="/register" style="color: var(--primary-color);">
            Don't have an account? Register
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  username: '',
  password: ''
});

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  const success = await authStore.login(form.username, form.password);

  loading.value = false;

  if (success) {
    if (authStore.isAdminUser) {
      router.push('/admin');
    } else {
      router.push('/challenges');
    }
  } else {
    errorMessage.value = 'Invalid username or password.';
  }
};
</script>