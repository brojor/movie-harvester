import type { Job } from 'bullmq'
import type { Bundle } from '~/types'

export const useBundlesStore = defineStore('bundles', {
  state: () => ({
    bundles: {} as Record<string, Bundle>,
  }),

  actions: {
    async addBundleJob(job: Job, partIds?: string[]) {
      if (!job.id || !job.name) {
        throw new Error('Invalid job')
      }

      if (!partIds) {
        partIds = await $fetch<string[]>(`/api/bundles/${job.id}`)
      }

      this.bundles[job.id] = {
        id: job.id,
        name: job.name,
        partIds: new Set(partIds),
      }
    },

    async initialize() {
      try {
        const jobs = await $fetch<Job[]>('/api/bundles/all')
        for (const job of jobs) {
          await this.addBundleJob(job)
        }
      }
      catch (error) {
        console.error('Error initializing bundles store:', error)
      }
    },
  },
})
