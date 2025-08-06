<script setup lang="ts">
import type FileCheck from './components/FileCheck.vue'
import type { CompletedJob, FailedJob, ProgressData } from './types'
import { useEventSource } from '@vueuse/core'

const clipboardContent = ref('')
const urlsToCheck = computed(() => extractWebshareUrls(clipboardContent.value))

const fileCheckRefs = ref<InstanceType<typeof FileCheck>[]>([])
const aliveUrls = computed(() => fileCheckRefs.value.filter(ref => ref?.state === 'alive').map(ref => ref?.url))

async function addToQueue() {
  await $fetch('/api/queue/bulk', {
    method: 'post',
    body: { urls: aliveUrls.value },
  })
}
function extractWebshareUrls(text: string): string[] {
  const regex = /https:\/\/webshare\.cz\/#\/file\/\S+/g
  const matches = text.match(regex)
  return matches ?? []
}

async function pasteFromClipboard(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText()
    clipboardContent.value = text
  }
  catch (error) {
    console.error('Failed to read clipboard:', error)
  }
}

const jobIdInput = ref('')
function pause() {
  $fetch(`/api/downloads/${jobIdInput.value}/pause`, {
    method: 'patch',
  })
}
function resume() {
  $fetch(`/api/downloads/${jobIdInput.value}/resume`, {
    method: 'patch',
  })
}
function cancel() {
  $fetch(`/api/downloads/${jobIdInput.value}`, {
    method: 'delete',
  })
}

const { event, data, status, error, close } = useEventSource<['progress', 'completed', 'failed'], ProgressData | CompletedJob | FailedJob>(
  '/api/downloads/stream',
  ['progress', 'completed', 'failed'],
  {
    autoReconnect: { retries: Infinity, delay: 2000 },
  },
)
const downloads = ref<Record<string, ProgressData>>({})

watch(data, (e) => {
  if (e && event.value === 'progress') {
    const { jobId, data } = JSON.parse(e) as ProgressEvent
    downloads.value[jobId] = data
  }
  else if (e && event.value === 'completed') {
    console.log('completed', e)
  }
  else if (e && event.value === 'failed') {
    console.log('failed', e)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-5">
    <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 max-w-4xl w-full">
      <h1 class="text-2xl font-bold text-white mb-4">
        Download Manager
      </h1>
      <div>
        <button v-if="urlsToCheck.length === 0" class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1 mb-4 bg-white/8" @click="pasteFromClipboard">
          Načíst ze schránky
        </button>
      </div>
      <div>
        <input v-model="jobIdInput" type="text">
        <button class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1 mb-4 bg-white/8" @click="pause">
          Pause
        </button>
        <button class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1 mb-4 bg-white/8" @click="resume">
          Resume
        </button>
        <button class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1 mb-4 bg-white/8" @click="cancel">
          Cancel
        </button>
      </div>
      <div v-if="urlsToCheck.length > 0" class="bg-white/8 rounded-2xl py-5 mb-4">
        <div class="flex justify-between items-center mx-5 pb-4 mb-4 border-b border-white/20">
          <h2 class="text-white/80 text-sm">
            <span>Live links:&nbsp;</span>
            <span class="font-bold">{{ aliveUrls.length }} / {{ urlsToCheck.length }}</span>
            <span class="text-white/80 text-sm">&nbsp;({{ Math.round((aliveUrls.length / urlsToCheck.length) * 100) }}%)</span>
          </h2>
          <button class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1" @click="addToQueue">
            Stáhnout
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
          <FileCheck v-for="url in urlsToCheck" :key="url" ref="fileCheckRefs" :url="url" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ThreadCard v-for="(progressData, jobId) in downloads" :key="jobId" :progress-data="progressData" :job-id="jobId" />
      </div>
    </div>
  </div>
</template>
