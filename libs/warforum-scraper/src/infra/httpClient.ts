import { Buffer } from 'node:buffer'
import { makeHttpClient } from '@repo/shared'
import iconv from 'iconv-lite'
import { env } from '../index.js'

const httpClient = makeHttpClient(env.WARFORUM_BASE_URL, {
  responseType: 'arraybuffer',
  useAgents: true,
  warforumEnv: {
    WARFORUM_BASE_URL: env.WARFORUM_BASE_URL,
    WARFORUM_SID: env.WARFORUM_SID,
    WARFORUM_USER_ID: env.WARFORUM_USER_ID,
    WARFORUM_AUTO_LOGIN_ID: env.WARFORUM_AUTO_LOGIN_ID,
  },
})

export async function fetchHtml(relativeUrl: string): Promise<string> {
  try {
    const data = await httpClient.get(relativeUrl)
    return iconv.decode(Buffer.from(data), 'windows-1250')
  }
  catch (error) {
    console.error(error)
    throw error
  }
}
