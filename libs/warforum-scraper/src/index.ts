import he from 'he'
import { fetchHtml } from './infra/httpClient.js'
import { indexMediaFromTopic } from './scraper/indexMediaFromTopic.js'

export { env } from './env.js'

export async function findCsfdIdInTopic(topicId: number): Promise<number | null> {
  const html = await fetchHtml(`viewtopic.php?t=${topicId}`)
  const decodedHtml = he.decode(html)
  const match = decodedHtml.match(/(?:www\.)?csfd\.cz\/film\/(\d+)/)
  if (match) {
    return Number.parseInt(match[1])
  }

  return null
}

export { indexMediaFromTopic }
