import type { HttpClient, HttpClientOpts } from './types.js'
import axios from 'axios'
import pLimit from 'p-limit'
import { makeAgents } from './agents.js'
import { getDelayMs, wait } from './utils/http-utils.js'
import { createRetryInterceptor, logOutgoingRequest } from './utils/interceptors.js'

const TIMEOUT_MS = 10_000
const DELAY_MIN = 5_000
const DELAY_MAX = 10_000
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

export function makeHttpClient(baseURL: string, opts: HttpClientOpts = {}): HttpClient {
  const {
    concurrency = 1,
    delayBetween = [DELAY_MIN, DELAY_MAX],
    retries = 3,
    bearerToken,
    responseType,
    userAgent = USER_AGENT,
    useAgents = false,
    warforumEnv,
  } = opts

  const agents = useAgents && warforumEnv ? makeAgents(concurrency, warforumEnv) : { httpAgent: undefined, httpsAgent: undefined }

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`
  }

  const client = axios.create({
    baseURL,
    ...(agents.httpAgent && { httpAgent: agents.httpAgent }),
    ...(agents.httpsAgent && { httpsAgent: agents.httpsAgent }),
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
