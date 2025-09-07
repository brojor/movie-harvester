import type { WarforumConfig } from '../index.js'
import { Buffer } from 'node:buffer'
import { makeHttpClient } from '@repo/shared'
import iconv from 'iconv-lite'

let httpClient: ReturnType<typeof makeHttpClient> | null = null

export function createWarforumClient(config: WarforumConfig): ReturnType<typeof makeHttpClient> {
  httpClient = makeHttpClient(config.baseUrl, {
    responseType: 'arraybuffer',
    useAgents: true,
    warforumEnv: {
      WARFORUM_BASE_URL: config.baseUrl,
      WARFORUM_SID: config.sid,
      WARFORUM_USER_ID: config.userId,
      WARFORUM_AUTO_LOGIN_ID: config.autoLoginId,
    },
  })
  return httpClient
}

function getHttpClient(): ReturnType<typeof makeHttpClient> {
  if (!httpClient) {
    throw new Error('Warforum client not initialized. Call createWarforumClient() first.')
  }
  return httpClient
}

export async function fetchHtml(relativeUrl: string): Promise<string> {
  try {
    const data = await getHttpClient().get(relativeUrl)
    return iconv.decode(Buffer.from(data), 'windows-1250')
  }
  catch (error) {
    console.error(error)
    throw error
  }
}
