import type { MovieWithTopicId, TopicKey } from '../types/domain.js'
import { fetchHtml } from '../infra/httpClient.js'
import { parseTopicPage } from './parseTopicPage.js'

export async function fetchAllMovies(
  url: string,
  topicType: TopicKey,
  acc: MovieWithTopicId[] = [],
): Promise<MovieWithTopicId[]> {
  try {
    const html = await fetchHtml(url)
    const { movies, nextPage } = parseTopicPage(html, topicType)

    const collected = [...acc, ...movies]

    if (nextPage) {
      return fetchAllMovies(nextPage, topicType, collected)
    }

    return collected
  }
  catch (error) {
    console.error('Chyba při načítání filmů:', error)
    return acc
  }
}
