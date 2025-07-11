import type { ProgressData, Threads } from '../../types'
import ipc from 'node-ipc'

ipc.config.id = 'nuxt-ws'
ipc.config.silent = true
ipc.serve()
ipc.server.start()

const threads: Threads = {}

export default defineWebSocketHandler({
  open(peer) {
    ipc.server.on('progress', (data) => {
      const payload = JSON.parse(data) as ProgressData
      threads[payload.id] = payload
      peer.send(JSON.stringify(threads))
    })
  },

  error(_peer, error) {
    console.error(`[ws] error: ${error}`)
  },
})
