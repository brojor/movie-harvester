import type { HttpClient, HttpClientOpts } from './types.js'
import axios from 'axios'
import pLimit from 'p-limit'
import { makeAgents } from './agents.js'
import { env } from './env.js'
import { getDelayMs, wait } from './utils/http-utils.js'
import { createRetryInterceptor, logOutgoingRequest } from './utils/interceptors.js'

const TIMEOUT_MS = 10_000

export function makeHttpClient(baseURL: string, opts: HttpClientOpts = {}): HttpClient {
  const {
    concurrency = 1,
    delayBetween = [env.HTTP_CLIENT_DELAY_MIN, env.HTTP_CLIENT_DELAY_MAX],
    retries = 3,
    bearerToken,
    responseType,
  } = opts

  const { httpAgent, httpsAgent } = makeAgents(concurrency)

  const headers: Record<string, string> = {
    'User-Agent': env.USER_AGENT,
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  const client = axios.create({
    baseURL,
    httpAgent,
    httpsAgent,
    withCredentials: true, // needed for cookies
    headers,
    timeout: TIMEOUT_MS,
    responseType,
  })

  client.interceptors.request.use(logOutgoingRequest)
  client.interceptors.response.use(undefined, createRetryInterceptor(retries, client))

  const gate = pLimit(concurrency)
  let requestCount = 0

  async function get<T = any>(path: string): Promise<T> {
    return gate(async () => {
      if (requestCount > 0) {
        await wait(getDelayMs(delayBetween))
      }
      requestCount++

      const { data } = await client.get(path)
      return data
    })
  }

  return { get }
}
