import type { Job, JobNode } from 'bullmq'
import type { ProgressData, ProgressEvent } from '~/types'

interface Bundle {
  id: string
  name: string
  partIds: string[]
}

interface Part {
  id: string
  name: string
  bundleId: string
  progress: ProgressData
}

export const useDownloadsStore = defineStore('downloads', {
  state: () => ({
    bundles: {} as Record<string, Bundle>,
    parts: {} as Record<string, Part>,
  }),

  getters: {
    partsByBundle: state => (bundleId: string) =>
      state.bundles[bundleId]?.partIds.map(id => state.parts[id]).filter(Boolean),

  },

  actions: {
    addBundleJob(jobNode: JobNode) {
      const bundle = jobNode.job
      const parts = jobNode.children?.map(c => c.job) ?? []

      if (!bundle || !bundle.id) {
        throw new Error('Invalid bundle')
      }

      this.bundles[bundle.id] = {
        id: bundle.id,
        name: bundle.name,
        partIds: [],
      }

      for (const part of parts) {
        if (!part || !part.id) {
          throw new Error('Invalid part')
        }

        const p: Part = {
          id: part.id,
          bundleId: bundle.id,
          name: part.name,
          progress: {
            transferred: 0,
            percentage: 0,
            length: 0,
            remaining: 0,
            eta: 0,
            runtime: 0,
            delta: 0,
            speed: 0,
          },
        }

        this.parts[p.id] = p
        this.bundles[bundle.id].partIds.push(p.id)
      }
    },

    handleProgressEvent(evt: ProgressEvent) {
      const part = this.parts[evt.jobId]
      if (!part) {
        throw new Error(`Part ${evt.jobId} not found`)
      }
      part.progress = evt.data
    },

    registerPartJob(job: Job) {
      if (!job.id || !job.name || !job.parent?.id) {
        throw new Error('Invalid job')
      }

      if (!this.bundles[job.parent.id]) {
        throw new Error(`Bundle ${job.parent.id} not found`)
      }

      this.parts[job.id] = {
        id: job.id,
        name: job.name,
        bundleId: job.parent.id,
        progress: job.progress as ProgressData,
      }

      this.bundles[job.parent.id].partIds.push(job.id)
    },

    registerBundleJob(job: Job) {
      if (!job.id || !job.name) {
        throw new Error('Invalid job')
      }

      this.bundles[job.id] = {
        id: job.id,
        name: job.name,
        partIds: [],
      }
    },

    removePartJob(jobId: string) {
      const part = this.parts[jobId]
      const bundle = this.bundles[part.bundleId]

      if (!part) {
        throw new Error(`Part ${jobId} not found`)
      }

      if (!bundle) {
        throw new Error(`Bundle ${part.bundleId} not found`)
      }

      delete this.parts[jobId]
      bundle.partIds = bundle.partIds.filter(id => id !== jobId)
    },
  },
})
