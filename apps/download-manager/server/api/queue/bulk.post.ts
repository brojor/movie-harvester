import type { BulkJobPayload } from '../../../types'
import { downloadQueue } from '@repo/queues'

export default defineEventHandler(async (event) => {
  const { urls } = await readBody<BulkJobPayload>(event)
  const bulkJobs = urls.map(url => ({
    name: 'download',
    data: { url },
  }))

  await downloadQueue.addBulk(bulkJobs)
})
