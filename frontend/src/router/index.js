import { createRouter, createWebHistory } from 'vue-router';
import { useSetupStore } from '@/stores/setup';
import { useAuthStore } from '@/stores/auth';

// Import Views
import HomeView from '@/views/HomeView.vue';
import SetupView from '@/views/SetupView.vue';

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
    
  ]
});

router.beforeEach(async (to, from, next) => {
  const setupStore = useSetupStore();
  const authStore = useAuthStore();

  if (setupStore.isCompleted === null) {
    await setupStore.fetchSetupStatus();
  }

  const setupNeeded = setupStore.isSetupRequired;
  const isSetupPage = to.name === 'Setup';

  if (setupNeeded && !isSetupPage) {
    return next({ name: 'Setup' });
  } 
  
  if (!setupNeeded && isSetupPage) {
    return next({ name: 'Home' });
  }
  next();
});

export default router;