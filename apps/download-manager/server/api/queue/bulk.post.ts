import type { BulkJobPayload } from '../../../types'
import { flowProducer } from '@repo/queues'

export default defineEventHandler(async (event) => {
  const { urls } = await readBody<BulkJobPayload>(event)
  const parrentjobName = 'Desperado'
  const children = urls.map(url => ({
    name: 'download',
    data: { url },
    queueName: 'download',
  }))

  // await downloadQueue.addBulk(bulkJobs)
  const jobNode = await flowProducer.add({
    name: parrentjobName,
    queueName: 'bundle-download',
    children,
  })

  return jobNode
})
