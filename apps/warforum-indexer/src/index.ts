import type { MovieSource } from 'packages/types/dist/index.js'
import { db, moviesSchema } from '@repo/database'
import { desc } from 'drizzle-orm'
import { upsertMovie } from './infra/database.js'
import { fetchAllMovies } from './scraper/fetchAllMovies.js'
import { fetchCsfdId } from './scraper/fetchCsfdId.js'
import { TOPIC_META, TopicKey } from './types/domain.js'
import { getTopicId } from './utils/parsing.js'

export async function parseTopics(): Promise<void> {
  const lastRun = (await db.select().from(moviesSchema.movieSources).orderBy(desc(moviesSchema.movieSources.createdAt)).limit(1))?.[0]?.createdAt

  for (const topicType of Object.values(TopicKey)) {
    const { id: topicId } = TOPIC_META[topicType]
    const movies = await fetchAllMovies(`viewforum.php?f=${topicId}`, topicType, [], lastRun)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

export async function getCsfdIdFromTopic(movie: MovieSource): Promise<string | null> {
  const topicId = getTopicId(movie)
  const csfdId = await fetchCsfdId(topicId)
  return csfdId
}
