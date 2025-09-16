import { bundleDownloadQueue } from '@repo/queues'

export default defineEventHandler(async () => {
  return bundleDownloadQueue.getJobs()
})
