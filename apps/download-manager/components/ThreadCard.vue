<script setup lang="ts">
import type { Part } from '../types'
import { useOptimisticUpdate } from '../composables/useOptimisticUpdate'
import { formatBytes, formatSpeed } from '../utils'

const props = defineProps<{
  part: Part
}>()

const activeDownloadsStore = useActiveDownloadsStore()
const pausedDownloadsStore = usePausedDownloadsStore()
const { update } = useOptimisticUpdate(3000)

function pause() {
  update(
    props.part.id,
    () => {
      activeDownloadsStore.removePart(props.part.id)
      pausedDownloadsStore.addPart(props.part)
    },
    () => {
      pausedDownloadsStore.removePart(props.part.id)
      activeDownloadsStore.addPart(props.part)
    },
  )

  $fetch(`/api/downloads/${props.part.id}/pause`, {
    method: 'patch',
  })
}

function resume() {
  update(
    props.part.id,
    () => {
      pausedDownloadsStore.removePart(props.part.id)
      activeDownloadsStore.addPart(props.part)
    },
    () => {
      activeDownloadsStore.removePart(props.part.id)
      pausedDownloadsStore.addPart(props.part)
    },
  )

  $fetch(`/api/downloads/${props.part.id}/resume`, {
    method: 'patch',
  })
}
function cancel() {
  $fetch(`/api/downloads/${props.part.id}`, {
    method: 'delete',
  })
}

// const { data: filename } = useFetch(`/api/downloads/${props.jobId}/filename`)
</script>

<template>
  <div v-if="part.progress" class="bg-white/8 rounded-2xl p-5">
    <div class="flex justify-between items-center mb-3">
      <span class="text-sm font-semibold text-blue-400 flex items-center">
        <span class="w-2 h-2 rounded-full mr-2" :class="{ 'bg-green-500': part.state === 'active', 'bg-yellow-500': part.state === 'paused' }" />{{ part.name }}</span>
      <span class="text-xs text-white/80">{{ `${formatSpeed(part.progress.speed)}` }}</span>
    </div>
    <div class="p-0.5 mb-2 flex items-center">
      <IconPause v-if="part.state === 'active'" class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="pause" />
      <IconPlay v-else class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="resume" />
      <IconCancel class="w-6 h-6 mr-2 text-white/80 border-white/20 border-2 rounded-full p-1 hover:bg-white/10 transition-colors duration-200 cursor-pointer" @click="cancel" />
      <div class="bg-black/20 rounded-lg flex-1">
        <div
          class="h-2 rounded-md transition-all duration-300 bg-gradient-to-r from-green-600/50 to-green-400/50"
          :style="{ width: `${part.progress.percentage}%` }"
        />
      </div>
    </div>
    <div class="flex justify-between text-xs text-white/80">
      <span>{{ formatBytes(part.progress.transferred, 2, false) }} / {{ formatBytes(part.progress.length) }}</span>
      <span>{{ (part.progress.percentage).toFixed(1) }}%</span>
    </div>
  </div>
</template>
