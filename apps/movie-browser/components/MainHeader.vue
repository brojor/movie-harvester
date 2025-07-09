<script setup lang="ts">
defineProps<{
  title: string
  year?: number
}>()
</script>

<template>
  <h1 class="text-[2.5vw] font-bold leading-[0.8] pb-2">
    {{ title }}
    <span v-if="year" class="font-normal">({{ year }})</span>
  </h1>
</template>
