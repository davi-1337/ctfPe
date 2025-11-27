import { createRouter, createWebHistory } from 'vue-router';
import { useSetupStore } from '@/stores/setup';
import { useAuthStore } from '@/stores/auth';

// components
import HomeView from '@/components/HomeView.vue';
import SetupView from '@/components/SetupView.vue';
import LoginView from '@/components/LoginView.vue';
import RegisterView from '@/components/RegisterView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/setup',
      name: 'Setup',
      component: SetupView
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'Register',
      component: RegisterView
    },
    // Placeholders for future protected routes
    {
      path: '/challenges',
      name: 'Challenges',
      component: HomeView, // Temporary
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'Admin',
      component: HomeView, // Temporary
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const setupStore = useSetupStore();
  const authStore = useAuthStore();

  // 1. Setup Check
  if (setupStore.isCompleted === null) {
    await setupStore.fetchSetupStatus();
  }

  if (setupStore.isSetupRequired && to.name !== 'Setup') {
    return next({ name: 'Setup' });
  } 
  
  if (setupStore.isSetupDone && to.name === 'Setup') {
    return next({ name: 'Home' });
  }

  // 2. Authentication Check
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' });
  }

  if (to.meta.requiresAdmin && !authStore.isAdminUser) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;