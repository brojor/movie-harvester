import { getMoviesMissingCsfdId, updateCsfdId, upsertMovie } from './infra/database.js'
import { fetchAllMovies } from './scraper/fetchAllMovies.js'
import { fetchCsfdId } from './scraper/fetchCsfdId.js'
import { TOPIC_META, TopicKey } from './types/domain.js'
import { getTopicId } from './utils/parsing.js'

async function main(): Promise<void> {
  // Fetch all movies from all topics
  for (const topicType of Object.values(TopicKey)) {
    const { id: topicId } = TOPIC_META[topicType]
    const movies = await fetchAllMovies(`viewforum.php?f=${topicId}`, topicType)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }

  // Fetch CSFD IDs for movies missing them
  const movies = await getMoviesMissingCsfdId()

  for (const movie of movies) {
    const topicId = getTopicId(movie)
    const csfdId = await fetchCsfdId(topicId)
    await updateCsfdId(movie, csfdId)
  }
}

main().catch(err => console.error('Fatal scraper error', err))
