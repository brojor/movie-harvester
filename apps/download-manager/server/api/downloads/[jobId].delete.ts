import { controlBus, queues } from '../../utils/redis'

const { downloadQueue } = queues

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!

  await controlBus.init()
  const job = await downloadQueue.getJob(jobId)

  await controlBus.send({ type: 'cancel', jobId })

  if (await job?.isDelayed()) {
    await downloadQueue.remove(jobId)
  }
  return { ok: true }
})
