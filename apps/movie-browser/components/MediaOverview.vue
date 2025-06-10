<script setup lang="ts">
defineProps<{
  overview: string
}>()
</script>

<template>
  <p class="text-[1.3vw] max-w-prose overflow-y-auto scrollbar-hide">
    {{ overview }}
  </p>
</template>
