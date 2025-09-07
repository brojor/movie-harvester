import type { WarforumConfig } from '../index.js'
import { Buffer } from 'node:buffer'
import { createWarforumAgents, makeHttpClient } from '@repo/shared'
import iconv from 'iconv-lite'

export type HttpClient = ReturnType<typeof makeHttpClient>

export function createWarforumClient(config: WarforumConfig): HttpClient {
  const agents = createWarforumAgents(1, {
    WARFORUM_BASE_URL: config.baseUrl,
    WARFORUM_SID: config.sid,
    WARFORUM_USER_ID: config.userId,
    WARFORUM_AUTO_LOGIN_ID: config.autoLoginId,
  })

  return makeHttpClient(config.baseUrl, {
    responseType: 'arraybuffer',
    httpAgent: agents.httpAgent,
    httpsAgent: agents.httpsAgent,
  })
}

export async function fetchHtml(httpClient: HttpClient, relativeUrl: string): Promise<string> {
  try {
    const data = await httpClient.get(relativeUrl)
    return iconv.decode(Buffer.from(data), 'windows-1250')
  }
  catch (error) {
    console.error(error)
    throw error
  }
}
