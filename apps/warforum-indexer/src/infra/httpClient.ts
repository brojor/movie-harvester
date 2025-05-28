import { Buffer } from 'node:buffer'
import { env, getThrottledClient } from '@repo/shared'
import iconv from 'iconv-lite'

const httpClient = getThrottledClient(env.WARFORUM_BASE_URL, {
  cookie: `warforum_sid=${env.WARFORUM_SID}`,
  responseType: 'arraybuffer',
  delayMs: [1000, 1500],
})

export async function fetchHtml(relativeUrl: string): Promise<string> {
  const data = await httpClient.get(relativeUrl)
  return iconv.decode(Buffer.from(data), 'windows-1250')
}
