import { bundleDownloadQueue } from '@repo/queues'

export default defineEventHandler(() => {
  return bundleDownloadQueue.getJobs()
})
