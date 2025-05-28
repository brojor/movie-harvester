import type { AxiosError } from 'axios'
import https from 'node:https'
import axios from 'axios'
import pLimit from 'p-limit'

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface HttpClientOptions {
  maxSockets?: number
  maxRetries?: number
  throttleConcurrency?: number
  userAgent?: string
  delayMs?: [number, number] | number
  cookie?: string
}

export function getThrottledClient(baseURL: string, options: HttpClientOptions = {}): {
  get: (url: string) => Promise<any>
} {
  const {
    maxSockets = 3,
    maxRetries = 5,
    throttleConcurrency = 2,
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    delayMs,
    cookie,
  } = options

  const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets,
  })

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
  }

  if (cookie) {
    headers.Cookie = cookie
  }

  const client = axios.create({
    baseURL,
    httpsAgent,
    headers,
  })

  const onRejected = async (error: AxiosError): Promise<void> => {
    const config: any = error.config

    if (!config || !config.retryCount) {
      config.retryCount = 0
    }

    const status = error.response?.status

    if ((status === 429 || status === 503) && config.retryCount < maxRetries) {
      config.retryCount++

      const wait = 2 ** config.retryCount * 1000
      console.warn(
        `🔁 Retry #${config.retryCount} for ${config.url} – waiting ${Math.round(wait)}ms`,
      )

      await delay(wait)
      return client(config)
    }

    return Promise.reject(error)
  }

  client.interceptors.request.use((config) => {
    const now = new Date().toISOString()
    console.log(`[${now}] Requesting ${config.url}`)
    return config
  })

  client.interceptors.response.use(undefined, onRejected)

  const limit = pLimit(throttleConcurrency)

  async function get(url: string): Promise<any> {
    return limit(async () => {
      if (delayMs) {
        const wait = Array.isArray(delayMs) ? randomIntBetween(...delayMs) : delayMs
        await delay(wait)
      }

      const response = await client.get(url)
      return response.data
    })
  }

  return { get }
}
