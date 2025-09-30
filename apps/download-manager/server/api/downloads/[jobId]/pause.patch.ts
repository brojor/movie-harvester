import { controlBus } from '../../../utils/redis'

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')!
  await controlBus.init()
  await controlBus.send({ type: 'pause', jobId })
  return { ok: true }
})
