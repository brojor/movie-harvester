import type { BulkJobPayload } from '../../../types'
import { flowProducer } from '@repo/queues'

export default defineEventHandler(async (event) => {
  const { urls, name } = await readBody<BulkJobPayload>(event)

  const children = urls.map((url) => {
    return {
      name: url.split('/').pop() ?? 'Unknown',
      data: { url },
      queueName: 'download',
    }
  })

  // await downloadQueue.addBulk(bulkJobs)
  const jobNode = await flowProducer.add({
    name,
    queueName: 'bundle-download',
    children,
  })

  return jobNode
})
