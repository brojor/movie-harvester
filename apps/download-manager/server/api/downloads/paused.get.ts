import { downloadQueue } from '@repo/queues'

export default defineEventHandler(() => {
  return downloadQueue.getDelayed()
})
