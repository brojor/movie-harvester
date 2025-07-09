<script setup lang="ts">
defineProps<{
  title: string
  year?: number
  networkLogo?: string | null
}>()
</script>

<template>
  <h1 class="text-[2.5vw] font-bold leading-[0.8] pb-2">
    {{ title }}
    <span v-if="year" class="font-normal">({{ year }})</span>
    <NuxtImg v-if="networkLogo" provider="tmdbNetwork" :src="networkLogo" class="ml-4 inline-block" />
  </h1>
</template>
