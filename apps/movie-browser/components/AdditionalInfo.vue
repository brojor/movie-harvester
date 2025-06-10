<script setup lang="ts">
defineProps<{
  items: string[]
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-for="(item, index) in items" :key="item">
      <span v-if="index > 0" class="text-[1vw]">•</span>
      <span class="text-[1vw]">{{ item }}</span>
    </template>
  </div>
</template>
