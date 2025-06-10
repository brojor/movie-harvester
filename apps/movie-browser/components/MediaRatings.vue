<script setup lang="ts">
const props = defineProps<{
  csfd?: number | null
  tmdb?: number | null
  rt?: number | null
}>()

const ratings = computed(() => {
  const items = []

  if (props.csfd) {
    items.push({ label: 'ČSFD', value: props.csfd })
  }

  if (props.tmdb) {
    items.push({ label: 'TMDB', value: Math.round(props.tmdb * 10) })
  }

  if (props.rt) {
    items.push({ label: 'RT', value: props.rt })
  }

  return items
})

function getColor(value: number): string {
  if (value < 40)
    return 'text-gray-500'
  if (value < 70)
    return 'text-blue-500'
  return 'text-red-500'
}
</script>

<template>
  <div class="font-bold text-lg">
    <template v-for="(rating, index) in ratings" :key="rating.label">
      <span v-if="index > 0" class="mx-2">/</span>
      <span :class="getColor(rating.value)">
        {{ rating.label }}: {{ rating.value }}%
      </span>
    </template>
  </div>
</template>
