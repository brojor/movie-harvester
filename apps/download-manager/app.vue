<script setup lang="ts">
import type { JobNode } from 'bullmq'
import type FileCheck from './components/FileCheck.vue'
import type { ActiveEvent, CompletedEvent, DelayedEvent, Part, ProgressEvent } from './types'
import { useEventSource } from '@vueuse/core'
import { useOptimisticUpdate } from './composables/useOptimisticUpdate'

const clipboardContent = ref('')
const bundleName = ref('')
const urlsToCheck = computed(() => extractWebshareUrls(clipboardContent.value))

const fileCheckRefs = ref<InstanceType<typeof FileCheck>[]>([])
const aliveUrls = computed(() => fileCheckRefs.value.filter(ref => ref?.state === 'alive').map(ref => ref?.url))

const activeDownloadsStore = useActiveDownloadsStore()
const pausedDownloadsStore = usePausedDownloadsStore()
const bundlesStore = useBundlesStore()

async function addToQueue() {
  const jobNode = await $fetch<JobNode>('/api/queue/bulk', {
    method: 'post',
    body: { urls: aliveUrls.value, bundleName: bundleName.value },
  })

  const { job: bundleJob, children } = jobNode

  await bundlesStore.addBundleJob(bundleJob, children?.map(child => child.job.id!))
  activeDownloadsStore.registerJobs(children?.map(child => child.job) ?? [])
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

const { event, data } = useEventSource<['progress', 'completed', 'failed', 'active', 'added', 'paused', 'delayed', 'resumed', 'removed'], string>(
  '/api/downloads/stream',
  ['progress', 'completed', 'failed', 'active', 'added', 'paused', 'delayed', 'resumed', 'removed'],
  {
    autoReconnect: { retries: Infinity, delay: 2000 },
  },
)

const { update, confirm, isPending } = useOptimisticUpdate(3000)

function pause(part: Part) {
  update(
    part.id,
    () => {
      activeDownloadsStore.removePart(part.id)
      pausedDownloadsStore.addPart(part)
    },
    () => {
      pausedDownloadsStore.removePart(part.id)
      activeDownloadsStore.addPart(part)
    },
  )
}

function resume(part: Part) {
  update(
    part.id,
    () => {
      pausedDownloadsStore.removePart(part.id)
      activeDownloadsStore.addPart(part)
    },
    () => {
      activeDownloadsStore.removePart(part.id)
      pausedDownloadsStore.addPart(part)
    },
  )
}

onMounted(async () => {
  await bundlesStore.initialize()
  await pausedDownloadsStore.initialize()
  await activeDownloadsStore.initialize()
})

const partsByBundle = (bundleId: string) => [...activeDownloadsStore.partsByBundle(bundleId), ...pausedDownloadsStore.partsByBundle(bundleId)].sort((a, b) => a.name.localeCompare(b.name))

/* eslint-disable no-console */
watch(data, (d) => {
  if (d && event.value === 'progress') {
    const progressEvent = JSON.parse(d) as ProgressEvent
    if (pausedDownloadsStore.ids.includes(progressEvent.jobId))
      return

    activeDownloadsStore.handleProgressEvent(progressEvent)
  }
  else if (d && event.value === 'completed') {
    console.log('completed', JSON.parse(d))
    const completedEvent = JSON.parse(d) as CompletedEvent
    activeDownloadsStore.removePart(completedEvent.jobId)
  }
  else if (d && event.value === 'active') {
    console.log('active', JSON.parse(d))
    const { jobId } = JSON.parse(d) as ActiveEvent
    if (isPending(jobId)) {
      confirm(jobId)
    }
  }
  else if (d && event.value === 'added') {
    console.log('added', JSON.parse(d))
  }
  else if (d && event.value === 'delayed') {
    console.log('delayed', JSON.parse(d))
    const { jobId } = JSON.parse(d) as DelayedEvent
    if (isPending(jobId)) {
      confirm(jobId)
    }
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
      <div v-if="urlsToCheck.length > 0" class="bg-white/8 rounded-2xl py-5 mb-4">
        <div class="mx-5">
          <input id="name" v-model="bundleName" type="text" name="name" class="text-white/80 hover:text-white/100 transition-colors duration-200 text-sm border border-white/20 rounded-lg px-2 py-1 mb-4 bg-white/8">
        </div>
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
      <div v-for="bundle in bundlesStore.bundles" :key="bundle.id">
        <h3 class="text-white/80 text-sm">
          {{ bundle.name }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <ThreadCard v-for="part in partsByBundle(bundle.id)" :key="part.id" :name="part.name" :progress-data="part.progress" :job-id="part.id" :state="part.state" @pause="pause(part)" @resume="resume(part)" />
        </div>
      </div>
    </div>
  </div>
</template>
