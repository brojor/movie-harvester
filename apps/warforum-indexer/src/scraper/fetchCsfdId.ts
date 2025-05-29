import he from 'he'
import { fetchHtml } from '../infra/httpClient.js'

export async function fetchCsfdId(topicId: number): Promise<string> {
  const html = await fetchHtml(`viewtopic.php?t=${topicId}`)
  const decodedHtml = he.decode(html)
  const match = decodedHtml.match(/www\.csfd\.cz\/film\/([^/]+)/)
  if (match) {
    return match[1]
  }
  throw new Error('No CSFD ID found')
}
