import { queues } from '../../utils/redis'

const { bundleDownloadQueue } = queues

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const bundle = await bundleDownloadQueue.getJob(id)
  if (!bundle) {
    throw createError({ statusCode: 404, statusMessage: 'Bundle not found' })
  }
  const deps = await bundle.getDependencies()
  const allDeps = [...Object.keys(deps.processed), ...deps.unprocessed]
  return allDeps.map((id: string) => id.split(':').at(-1) ?? '')
})
