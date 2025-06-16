import type { HttpClient, HttpClientOpts } from './types.js'
import https from 'node:https'
import axios from 'axios'
import pLimit from 'p-limit'
import { env } from './env.js'
import { getDelayMs, wait } from './utils/http-utils.js'
import { createRetryInterceptor, logOutgoingRequest } from './utils/interceptors.js'

const TIMEOUT_MS = 10_000

export async function makeHttpClient(baseURL: string, opts: HttpClientOpts = {}): Promise<HttpClient> {
  const {
    concurrency = 1,
    delayBetween = [800, 3000],
    retries = 3,
    bearerToken,
    responseType,
  } = opts

  const httpsAgent = new https.Agent({
    timeout: 8000, // kill hung socket
    keepAlive: true,
    maxSockets: concurrency + 1,
    maxFreeSockets: 1,
    keepAliveMsecs: 5000,
  })

  const headers: Record<string, string> = {
    'User-Agent': env.USER_AGENT,
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  const client = axios.create({
    baseURL,
    httpsAgent,
    withCredentials: true, // needed for cookies
    headers,
    timeout: TIMEOUT_MS,
    responseType,
  })

  client.interceptors.request.use(logOutgoingRequest)
  client.interceptors.response.use(undefined, createRetryInterceptor(retries, client))

  const gate = pLimit(concurrency)

  async function get<T = any>(path: string): Promise<T> {
    return gate(async () => {
      await wait(getDelayMs(delayBetween))
      const { data } = await client.get(path)
      return data
    })
  }

  return { get }
}
