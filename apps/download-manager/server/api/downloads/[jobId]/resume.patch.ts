import { downloadQueue } from '@repo/queues'

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const job = await downloadQueue.getJob(jobId)
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' })
  }
  job.promote()
  return { status: 'resumed', jobId }
})
