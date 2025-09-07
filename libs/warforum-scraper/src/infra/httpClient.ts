import type { WarforumAgentOpts } from '@repo/shared'
import { Buffer } from 'node:buffer'
import { createWarforumAgents, makeHttpClient } from '@repo/shared'
import iconv from 'iconv-lite'

export type HttpClient = ReturnType<typeof makeHttpClient>

export function createWarforumClient(opts: WarforumAgentOpts): HttpClient {
  const agents = createWarforumAgents(1, opts)

  return makeHttpClient(opts.baseUrl, {
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
