import { createEventStream, eventHandler } from 'h3'
import { downloadQueueEvents } from '../../utils/redis'

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

  downloadQueueEvents.on('progress', onProgress)
  downloadQueueEvents.on('completed', onCompleted)
  downloadQueueEvents.on('failed', onFailed)
  downloadQueueEvents.on('active', onActive)
  downloadQueueEvents.on('added', onAdded)
  downloadQueueEvents.on('paused', onPaused)
  downloadQueueEvents.on('delayed', onDelayed)
  downloadQueueEvents.on('resumed', onResumed)
  downloadQueueEvents.on('removed', onRemoved)

  sse.onClosed(() => {
    downloadQueueEvents.off('progress', onProgress)
    downloadQueueEvents.off('completed', onCompleted)
    downloadQueueEvents.off('failed', onFailed)
    downloadQueueEvents.off('active', onActive)
    downloadQueueEvents.off('added', onAdded)
    downloadQueueEvents.off('paused', onPaused)
    downloadQueueEvents.off('delayed', onDelayed)
    downloadQueueEvents.off('resumed', onResumed)
    downloadQueueEvents.off('removed', onRemoved)
  })

  return sse.send()
})
