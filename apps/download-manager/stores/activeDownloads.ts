import type { Job } from 'bullmq'
import type { Part, ProgressData, ProgressEvent } from '~/types'

const initialProgress: ProgressData = {
  percentage: 0,
  transferred: 0,
  length: 0,
  remaining: 0,
  eta: Infinity,
  runtime: 0,
  delta: 0,
  speed: 0,
}

export const useActiveDownloadsStore = defineStore('activeDownloads', {
  state: () => ({
    parts: {} as Record<string, Part>,
    isInitialized: false,
  }),

  getters: {
    partsByBundle: state => (bundleId: string) => {
      const bundleStore = useBundlesStore()
      return Array.from(bundleStore.bundles[bundleId]?.partIds ?? []).map(id => state.parts[id]).filter(Boolean)
    },
  },

  actions: {
    async handleProgressEvent(evt: ProgressEvent) {
      if (!this.isInitialized)
        return

      const part = this.parts[evt.jobId]
      if (!part) {
        return
        throw new Error(`Part ${evt.jobId} not found`)
      }
      part.progress = evt.data
    },

    addPart(part: Part) {
      if (!part.id || !part.name) {
        throw new Error('Invalid job')
      }

      part.state = 'active'

      this.parts[part.id] = part
    },

    removePart(partId: string) {
      const part = this.parts[partId]

      if (!part) {
        throw new Error(`Part ${partId} not found`)
      }

      delete this.parts[partId]
      return part
    },

    registerJob(job: Job) {
      if (!job.id || !job.name) {
        throw new Error('Invalid job')
      }

      const part = {
        id: job.id,
        name: job.name,
        progress: { ...initialProgress },
        state: 'active',
      } as const
      this.addPart(part)
    },

    async initialize() {
      try {
        const jobs = await $fetch<Job[]>('/api/downloads/active')
        for (const job of jobs) {
          this.registerJob(job)
        }
        this.isInitialized = true
      }
      catch (error) {
        console.error('Error initializing active downloads store:', error)
      }
    },
  },
})
