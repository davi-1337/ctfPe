<template>
  <button :type="type" class="btn">
    <slot v-if="!loading"></slot>
    <span v-else>Loading...</span>
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'button',
  },
  loading: Boolean,
});
</script>