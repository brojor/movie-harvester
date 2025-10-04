import { queues } from '../../utils/redis.js'

const { downloadQueue } = queues

export default defineEventHandler(() => {
  return downloadQueue.getDelayed()
})
