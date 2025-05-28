import { upsertMovie } from './infra/database.js'
import { fetchAllMovies } from './scraper/fetchAllMovies.js'
import { TOPIC_META, TopicKey } from './types/domain.js'

async function main(): Promise<void> {
  for (const topicType of Object.values(TopicKey)) {
    const { id: topicId } = TOPIC_META[topicType]
    const movies = await fetchAllMovies(`viewforum.php?f=${topicId}`, topicType)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

main().catch(err => console.error('Fatal scraper error', err))
