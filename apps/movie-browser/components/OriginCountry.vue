<script setup lang="ts">
defineProps<{
  originCountry: string
  originTitle: string
}>()
</script>

<template>
  <h2 class="text-[1.25vw] font-bold flex items-center gap-2">
    <div :class="`i-circle-flags:${originCountry}`" />
    <span class="text-[1.25vw]">{{ originTitle }}</span>
  </h2>
</template>
