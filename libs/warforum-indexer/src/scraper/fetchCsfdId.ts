import he from 'he'
import { fetchHtml } from '../infra/httpClient.js'

export async function fetchCsfdId(topicId: number): Promise<string | null> {
  const html = await fetchHtml(`viewtopic.php?t=${topicId}`)
  const decodedHtml = he.decode(html)
  const match = decodedHtml.match(/www\.csfd\.cz\/film\/([^/\s"'<>&?#]+)/)
  if (match) {
    return match[1]
  }
  return null
}
