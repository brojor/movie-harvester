import type { InternalAxiosRequestConfig } from 'axios'
import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'

export interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number
}

export interface HttpClient {
  get: <T = any>(path: string) => Promise<T>
}

export interface WarforumAgentOpts {
  baseUrl: string
  sid: string
  userId: number
  autoLoginId: string
}

export interface HttpClientOpts {
  concurrency?: number
  delayBetween?: number | [number, number]
  retries?: number
  bearerToken?: string
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  userAgent?: string
  httpAgent?: HttpAgent
  httpsAgent?: HttpsAgent
}
