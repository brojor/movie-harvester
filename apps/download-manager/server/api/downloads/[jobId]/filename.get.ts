import { queues } from '../../../utils/redis'

const { downloadQueue } = queues

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const job = await downloadQueue.getJob(jobId)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
  return job.data.filename
})
