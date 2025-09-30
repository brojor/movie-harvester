import { queues } from '../../utils/redis'

const { bundleDownloadQueue } = queues

export default defineEventHandler(async () => {
  return bundleDownloadQueue.getJobs()
})
