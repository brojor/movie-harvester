import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { RetryConfig } from '../types.js'
import { isRetryableStatus, wait } from './http-utils.js'

const MAX_BACKOFF_MS = 30_000
const BASE_BACKOFF_MS = 1000

export function logOutgoingRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Requesting ${config.baseURL}${config.url}`)
  return config
}

export function createRetryInterceptor(retries: number, client: AxiosInstance) {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    const config = error.config as RetryConfig

    if (!config) {
      return Promise.reject(error)
    }

    config.retryCount = (config.retryCount || 0) + 1

    const shouldRetry = config.retryCount <= retries && isRetryableStatus(error.response?.status)

    if (shouldRetry) {
      const backoffTime = Math.min(2 ** config.retryCount * BASE_BACKOFF_MS, MAX_BACKOFF_MS)
      console.warn(`🔁 Retry #${config.retryCount}/${retries} for ${config.url} in ${backoffTime}ms`)

      await wait(backoffTime)
      return client(config)
    }

    return Promise.reject(error)
  }
}
