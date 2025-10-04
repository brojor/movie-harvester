import type { Job } from 'bullmq'
import type { Part, ProgressData } from '~/types'

export const usePausedDownloadsStore = defineStore('pausedDownloads', {
  state: () => ({
    parts: {} as Record<string, Part>,
    isInitialized: false,
  }),

  getters: {
    partsByBundle: state => (bundleId: string) => {
      const bundleStore = useBundlesStore()
      return Array.from(bundleStore.bundles[bundleId]?.partIds ?? []).map(id => state.parts[id]).filter(Boolean)
    },
    ids: state => Object.keys(state.parts),
  },

  actions: {
    addPart(part: Part) {
      if (!part.id || !part.name) {
        throw new Error('Invalid job')
      }

      part.state = 'paused'

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
        progress: job.progress as ProgressData,
        state: 'paused',
      } as const
      this.addPart(part)
    },

    async initialize() {
      try {
        const jobs = await $fetch<Job[]>('/api/downloads/paused')
        for (const job of jobs) {
          this.registerJob(job)
        }
        this.isInitialized = true
      }
      catch (error) {
        console.error('Error initializing paused downloads store:', error)
      }
    },
  },
})
