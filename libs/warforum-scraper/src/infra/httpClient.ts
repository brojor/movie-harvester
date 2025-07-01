import { Buffer } from 'node:buffer'
import { env, makeHttpClient } from '@repo/shared'
import iconv from 'iconv-lite'

const httpClient = makeHttpClient(env.WARFORUM_BASE_URL, {
  responseType: 'arraybuffer',
  delayBetween: 10_000,
})

export async function fetchHtml(relativeUrl: string): Promise<string> {
  const data = await httpClient.get(relativeUrl)
  return iconv.decode(Buffer.from(data), 'windows-1250')
}
