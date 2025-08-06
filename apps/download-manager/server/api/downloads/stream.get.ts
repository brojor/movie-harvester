import { downloadQueueEvents } from '@repo/queues'
import { createEventStream, eventHandler } from 'h3'

export default eventHandler((event) => {
  const sse = createEventStream(event)

  const push = (eventName: 'progress' | 'completed' | 'failed', payload: unknown): Promise<void> =>
    sse.push({ event: eventName, data: JSON.stringify(payload) }) // <- pojmenované eventy

  const onProgress = (evt: any): Promise<void> => push('progress', evt)
  const onCompleted = (evt: any): Promise<void> => push('completed', evt)
  const onFailed = (evt: any): Promise<void> => push('failed', evt)

  downloadQueueEvents.on('progress', onProgress)
  downloadQueueEvents.on('completed', onCompleted)
  downloadQueueEvents.on('failed', onFailed)

  sse.onClosed(() => {
    downloadQueueEvents.off('progress', onProgress)
    downloadQueueEvents.off('completed', onCompleted)
    downloadQueueEvents.off('failed', onFailed)
  })

  return sse.send()
})
