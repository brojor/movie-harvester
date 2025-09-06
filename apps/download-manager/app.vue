<script setup lang="ts">
import type FileCheck from './components/FileCheck.vue'
import type { CompletedJob, FailedJob, ProgressData, ProgressEvent } from './types'
import { useEventSource } from '@vueuse/core'

const clipboardContent = ref('')
const urlsToCheck = computed(() => extractWebshareUrls(clipboardContent.value))

const fileCheckRefs = ref<InstanceType<typeof FileCheck>[]>([])
const aliveUrls = computed(() => fileCheckRefs.value.filter(ref => ref?.state === 'alive').map(ref => ref?.url))

const { registerJobs, upsertFromEvent } = useProgressStore()

async function addToQueue() {
  const jobNode = await $fetch('/api/queue/bulk', {
    method: 'post',
    body: { urls: aliveUrls.value },
  })
  const { job, children } = jobNode
  registerJobs(job.id!, children?.map(child => child.job!.id!) ?? [])
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

const { event, data, status, error, close } = useEventSource<['progress', 'completed', 'failed', 'active', 'added', 'paused', 'delayed', 'resumed', 'removed'], string>(
  '/api/downloads/stream',
  ['progress', 'completed', 'failed', 'active', 'added', 'paused', 'delayed', 'resumed', 'removed'],
  {
    autoReconnect: { retries: Infinity, delay: 2000 },
  },
)

type JobStatus = 'active' | 'paused'
interface PendingAction { next: JobStatus, timeoutId?: ReturnType<typeof setTimeout> }

const downloads = ref<Record<string, ProgressData>>({})
const downloadStates = ref<Record<string, 'active' | 'paused'>>({})
const pending = ref<Map<string, PendingAction>>(new Map())

function setOptimisticState(jobId: string, nextState: JobStatus) {
  const currentState = downloadStates.value[jobId]
  if (currentState === nextState)
    return
  downloadStates.value[jobId] = nextState
  const timeoutId = setTimeout(() => {
    downloadStates.value[jobId] = currentState
    pending.value.delete(jobId)
  }, 3000)
  pending.value.set(jobId, { next: nextState, timeoutId })
}

function clearPending(jobId: string) {
  const p = pending.value.get(jobId)
  if (p?.timeoutId)
    clearTimeout(p.timeoutId)
  pending.value.delete(jobId)
}

const isInitializing = ref(true)

const activeDownloads = await $fetch('/api/downloads/active')
const pausedDownloads = await $fetch('/api/downloads/paused')
const allDownloads = await $fetch('/api/downloads/all')

console.log('allDownloads', allDownloads)

// for (const job of activeDownloads) {
//   downloadStates.value[job.id!] = 'active'
//   if (!job.id || !job.parent || !job.parent.id) {
//     console.error('job has no id or parent', job)
//     continue
//   }
//   registerJob(job.parent.id, job.id)
// }
// for (const job of pausedDownloads) {
//   downloadStates.value[job.id!] = 'paused'
//   downloads.value[job.id!] = job.progress as ProgressData
// }
isInitializing.value = false

watch(data, (d) => {
  if (d && event.value === 'progress') {
    const { jobId, data } = JSON.parse(d) as ProgressEvent
    if (downloadStates.value[jobId] === 'paused')
      return

    upsertFromEvent({ jobId, data })
  }
  else if (d && event.value === 'completed') {
    console.log('completed', d)
    const { jobId } = JSON.parse(d) as { jobId: string, returnValue: any, prev: string }
    delete downloads.value[jobId]
  }
  else if (d && event.value === 'failed') {
    console.log('failed', d)
  }
  else if (d && event.value === 'active') {
    console.log('active', d)
    const { jobId } = JSON.parse(d) as { jobId: string, prev: string }
    if (pending.value.has(jobId) && pending.value.get(jobId)?.next === 'active')
      clearPending(jobId)
  }
  else if (d && event.value === 'added') {
    console.log('added', d)
    const { jobId } = JSON.parse(d) as { jobId: string, name: string }
    downloadStates.value[jobId] = 'active'
  }
  else if (d && event.value === 'paused') {
    console.log('paused', d)
    const { jobId } = JSON.parse(d) as { jobId: string, prev: string }
    if (pending.value.has(jobId) && pending.value.get(jobId)?.next === 'paused')
      clearPending(jobId)
  }
  else if (d && event.value === 'delayed') {
    console.log('delayed', d)
    const { jobId } = JSON.parse(d) as { jobId: string, prev: string }
    if (pending.value.has(jobId) && pending.value.get(jobId)?.next === 'paused')
      clearPending(jobId)
  }
  else if (d && event.value === 'resumed') {
    console.log('resumed', d)
    const { jobId } = JSON.parse(d) as { jobId: string, prev: string }
    if (pending.value.has(jobId) && pending.value.get(jobId)?.next === 'active')
      clearPending(jobId)
  }
  else if (d && event.value === 'removed') {
    console.log('removed', d)
    const { jobId } = JSON.parse(d) as { jobId: string, prev: string }
    delete downloads.value[jobId]
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
      <div v-if="!isInitializing" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ThreadCard v-for="(progressData, jobId) in downloads" :key="jobId" :progress-data="progressData" :job-id="jobId" :state="downloadStates[jobId]" @pause="setOptimisticState(jobId, 'paused')" @resume="setOptimisticState(jobId, 'active')" />
      </div>
    </div>
  </div>
</template>
