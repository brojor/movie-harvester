import { downloadQueue } from '@repo/queues'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  downloadQueue.add('download', { url: body.url })
  return { body }
})
