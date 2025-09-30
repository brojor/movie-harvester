import { queues } from '../../utils/redis'

const { bundleDownloadQueue } = queues

export default defineEventHandler(() => {
  return bundleDownloadQueue.getJobs()
})
