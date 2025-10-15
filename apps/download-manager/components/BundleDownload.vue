<script setup lang="ts">
import type { Bundle } from '../types'
import { formatBytes, formatSpeed } from '../utils'
import ThreadCard from './ThreadCard.vue'

const props = defineProps<{
  bundle: Bundle
}>()

const activeDownloadsStore = useActiveDownloadsStore()
const pausedDownloadsStore = usePausedDownloadsStore()
const bundlesStore = useBundlesStore()

const parts = computed(() => [...activeDownloadsStore.partsByBundle(props.bundle.id), ...pausedDownloadsStore.partsByBundle(props.bundle.id)].sort((a, b) => a.name.localeCompare(b.name)))
</script>

<template>
  <div>
    <h3 class="text-white/80 text-sm">
      {{ bundle.name }}
    </h3>
    <p class="text-white/80 text-sm">
      {{ formatBytes(bundlesStore.progress(bundle.id).transferred) }} / {{ formatBytes(bundlesStore.progress(bundle.id).length) }} ({{ Math.round(bundlesStore.progress(bundle.id).percentage * 100) }}%) @ {{ formatSpeed(bundlesStore.progress(bundle.id).speed) }}
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <ThreadCard v-for="part in parts" :key="part.id" :part="part" />
    </div>
  </div>
</template>
