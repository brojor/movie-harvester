<script setup lang="ts">
import type { ProgressData } from '../types'

const props = defineProps<{
  progressData: ProgressData | 0
  jobId: string
  state: 'active' | 'paused'
}>()

const emit = defineEmits<{
  (e: 'pause'): void
  (e: 'resume'): void
}>()

function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}
function pause() {
  $fetch(`/api/downloads/${props.jobId}/pause`, {
    method: 'patch',
  })
  emit('pause')
}
function resume() {
  $fetch(`/api/downloads/${props.jobId}/resume`, {
    method: 'patch',
  })
  emit('resume')
}
function cancel() {
  $fetch(`/api/downloads/${props.jobId}`, {
    method: 'delete',
  })
}

const { data: filename } = useFetch(`/api/downloads/${props.jobId}/filename`)
</script>

<template>
  <div v-if="progressData" class="bg-white/8 rounded-2xl p-5">
    <div class="flex justify-between items-center mb-3">
      <span class="text-sm font-semibold text-blue-400 flex items-center">
        <span class="w-2 h-2 rounded-full mr-2" :class="{ 'bg-green-500': state === 'active', 'bg-yellow-500': state === 'paused' }" />{{ filename }}</span>
      <span class="text-xs text-white/80">{{ `${formatBytes(progressData.speed)}/s` }}</span>
    </div>
    <div class="p-0.5 mb-2 flex items-center">
      <IconPause v-if="state === 'active'" class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="pause" />
      <IconPlay v-else class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="resume" />
      <IconCancel class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="cancel" />
      <div class="bg-black/20 rounded-lg flex-1">
        <div
          class="h-2 rounded-md transition-all duration-300 bg-gradient-to-r from-green-600/50 to-green-400/50"
          :style="{ width: `${progressData.percentage}%` }"
        />
      </div>
    </div>
    <div class="flex justify-between text-xs text-white/80">
      <span>{{ formatBytes(progressData.transferred) }}</span>
      <span>{{ (progressData.percentage).toFixed(1) }}%</span>
    </div>
  </div>
</template>
