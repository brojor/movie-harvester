<script setup lang="ts">
import type { ProgressData } from '../types'

defineProps<{
  thread: ProgressData
}>()

function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}
</script>

<template>
  <div class="bg-white/8 rounded-2xl p-5">
    <div class="flex justify-between items-center mb-3">
      <span class="text-sm font-semibold text-blue-400 flex items-center">
        <span class="w-2 h-2 rounded-full mr-2 bg-green-500" />{{ thread.id }}</span>
      <span class="text-xs text-white/80">{{ `${formatBytes(thread.speed)}/s` }}</span>
    </div>
    <div class="bg-black/20 rounded-lg p-0.5 mb-2">
      <div
        class="h-2 rounded-md transition-all duration-300 bg-gradient-to-r from-green-600/50 to-green-400/50"
        :style="{ width: `${thread.percentage}%` }"
      />
    </div>
    <div class="flex justify-between text-xs text-white/80">
      <span>{{ formatBytes(thread.transferred) }}</span>
      <span>{{ (thread.percentage).toFixed(1) }}%</span>
    </div>
  </div>
</template>
