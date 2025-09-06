import { bundleDownloadQueueEvents } from '@repo/queues'
import { createEventStream, eventHandler } from 'h3'

export default eventHandler((event) => {
  const sse = createEventStream(event)

  const push = (eventName: 'progress' | 'completed' | 'failed' | 'active' | 'added' | 'paused' | 'delayed' | 'resumed' | 'removed', payload: unknown): Promise<void> =>
    sse.push({ event: eventName, data: JSON.stringify(payload) }) // <- pojmenované eventy

  const onProgress = (evt: any): Promise<void> => push('progress', evt)
  const onCompleted = (evt: any): Promise<void> => push('completed', evt)
  const onFailed = (evt: any): Promise<void> => push('failed', evt)
  const onActive = (evt: any): Promise<void> => push('active', evt)
  const onAdded = (evt: any): Promise<void> => push('added', evt)
  const onPaused = (evt: any): Promise<void> => push('paused', evt)
  const onDelayed = (evt: any): Promise<void> => push('delayed', evt)
  const onResumed = (evt: any): Promise<void> => push('resumed', evt)
  const onRemoved = (evt: any): Promise<void> => push('removed', evt)

  bundleDownloadQueueEvents.on('progress', onProgress)
  bundleDownloadQueueEvents.on('completed', onCompleted)
  bundleDownloadQueueEvents.on('failed', onFailed)
  bundleDownloadQueueEvents.on('active', onActive)
  bundleDownloadQueueEvents.on('added', onAdded)
  bundleDownloadQueueEvents.on('paused', onPaused)
  bundleDownloadQueueEvents.on('delayed', onDelayed)
  bundleDownloadQueueEvents.on('resumed', onResumed)
  bundleDownloadQueueEvents.on('removed', onRemoved)

  sse.onClosed(() => {
    bundleDownloadQueueEvents.off('progress', onProgress)
    bundleDownloadQueueEvents.off('completed', onCompleted)
    bundleDownloadQueueEvents.off('failed', onFailed)
    bundleDownloadQueueEvents.off('active', onActive)
    bundleDownloadQueueEvents.off('added', onAdded)
    bundleDownloadQueueEvents.off('paused', onPaused)
    bundleDownloadQueueEvents.off('delayed', onDelayed)
    bundleDownloadQueueEvents.off('resumed', onResumed)
    bundleDownloadQueueEvents.off('removed', onRemoved)
  })

  return sse.send()
})
