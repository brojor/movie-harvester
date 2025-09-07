import type { InternalAxiosRequestConfig } from 'axios'
import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'

export interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number
}

export interface HttpClient {
  get: <T = any>(path: string) => Promise<T>
}

export interface WarforumEnv {
  WARFORUM_BASE_URL: string
  WARFORUM_SID: string
  WARFORUM_USER_ID: number
  WARFORUM_AUTO_LOGIN_ID: string
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
