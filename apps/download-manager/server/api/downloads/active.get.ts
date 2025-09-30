import { queues } from '../../utils/redis'

const { downloadQueue } = queues

export default defineEventHandler(() => {
  return downloadQueue.getActive()
})
