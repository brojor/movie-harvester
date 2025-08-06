import type { RedisOptions } from 'ioredis'
import { Redis } from 'ioredis'

export type ControlCmd
  = | { type: 'pause', jobId: string }
    | { type: 'cancel', jobId: string }

const CHANNEL = 'downloads:control'

export class ControlBus {
  private pub: Redis
  private sub: Redis
  private listeners = new Set<(cmd: ControlCmd) => void>()
  private ready = false

  constructor(connection: RedisOptions) {
    this.pub = new Redis(connection)
    this.sub = new Redis(connection)
  }

  async init(): Promise<void> {
    if (this.ready)
      return
    await this.sub.subscribe(CHANNEL)
    this.sub.on('message', (_, msg: string) => {
      try {
        const cmd = JSON.parse(msg) as ControlCmd
        for (const l of this.listeners) l(cmd)
      }
      catch {}
    })
    this.ready = true
  }

  onCommand(fn: (cmd: ControlCmd) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  async send(cmd: ControlCmd): Promise<void> {
    await this.pub.publish(CHANNEL, JSON.stringify(cmd))
  }
}
