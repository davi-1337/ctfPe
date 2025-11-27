<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="nav-brand">CTFPE</router-link>
      
      <div class="nav-links">
        <router-link to="/login">Login</router-link>
        <router-link to="/register" class="nav-btn">Register</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
// No logic needed for this simple navbar
</script>