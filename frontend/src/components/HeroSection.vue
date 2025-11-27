<template>
  <section class="hero text-center">
    <div class="container flex-center" style="flex-direction: column;">
      
      <h1>{{ title }}</h1>
      
      <div class="ctf-dates">
        <div class="date-item">
          <span>Start</span>
          {{ formatDate(start) }}
        </div>
        <div class="date-item">
          <span>End</span>
          {{ formatDate(end) }}
        </div>
      </div>

      <p class="description">
        Join the arena. Hack the planet. Prove your worth.
      </p>

      <router-link to="/register" class="btn">
        Get Started
      </router-link>

    </div>
  </section>
</template>

<script setup>
defineProps({
  title: String,
  start: String,
  end: String
});

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};
</script>