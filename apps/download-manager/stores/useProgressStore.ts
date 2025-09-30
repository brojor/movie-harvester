import type { BundleId, JobId, ProgressData, ProgressEvent } from '~/types'
import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'

export interface Job {
  id: JobId
  parentId: BundleId
  data: ProgressData
}

export interface Bundle {
  id: BundleId
  name: string
  jobIds: Set<JobId>
}

export const useProgressStore = defineStore('progress', () => {
  const parents = reactive(new Map<BundleId, Bundle>())
  const jobs = reactive(new Map<JobId, Job>())

  function registerParent(parentId: BundleId, name: string): void {
    if (!parents.has(parentId)) {
      console.log(`Setting parent ${parentId} to ${name}`)
      parents.set(parentId, {
        id: parentId,
        name,
        jobIds: new Set(),
      })
    }
  }

  function registerJobs(bundleId: BundleId, jobIds: JobId[]): void {
    registerParent(bundleId, bundleId)
    const p = parents.get(bundleId)
    if (!p) {
      throw new Error(`Parent ${bundleId} not found`)
    }

    for (const jobId of jobIds) {
      if (jobs.has(jobId)) {
        throw new Error(`Job ${jobId} already registered`)
      }

      jobs.set(jobId, {
        id: jobId,
        parentId: bundleId,
        data: { transferred: 0, percentage: 0, length: 0, remaining: 0, eta: Infinity, runtime: 0, delta: 0, speed: 0 },
      })
      p.jobIds.add(jobId)
    }
  }

  function upsertFromEvent(evt: ProgressEvent): void {
    const job = jobs.get(evt.jobId)
    if (!job) {
      throw new Error(`Job ${evt.jobId} not found`)
    }
    job.data = evt.data
  }

  // selektory
  const parentsArray = computed(() => Array.from(parents.values()))

  function jobsByParent(pid: BundleId): Job[] {
    return Array.from(parents.get(pid)?.jobIds ?? [] as JobId[])
      .map(jid => jobs.get(jid)!)
      .filter(Boolean)
  }

  return {
    parents,
    jobs,
    registerParent,
    registerJobs,
    upsertFromEvent,
    parentsArray,
    jobsByParent,
  }
})
