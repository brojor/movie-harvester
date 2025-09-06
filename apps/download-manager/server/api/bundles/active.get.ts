import { bundleDownloadQueue, downloadQueue } from '@repo/queues'

export default defineEventHandler(async () => {
  const jobs = await bundleDownloadQueue.getWaitingChildren()
  const job = jobs[0]
  const { unprocessed, processed } = await job.getDependencies()

  console.log({ unprocessed, processed })

  //   const activeChildren = unprocessed?.filter(async (id) => {
  //     const jobId = id.split(':').pop()
  //     console.log({ jobId })

  //     if (!jobId) {
  //       return false
  //     }

  //     const job = await downloadQueue.getJob(jobId)
  //     const isActive = await job?.isActive()
  //     console.log({ isActive })
  //     return isActive
  //   })

  //   console.log({ activeChildren })
  //   return activeChildren
  const activeChildren = []
  if (!unprocessed) {
    return []
  }
  for (const id of unprocessed) {
    const jobId = id.split(':').pop()
    if (!jobId) {
      continue
    }
    const job = await downloadQueue.getJob(jobId)
    const isActive = await job?.isActive()

    if (isActive) {
      activeChildren.push(job)
    }
  }

  return activeChildren
})
