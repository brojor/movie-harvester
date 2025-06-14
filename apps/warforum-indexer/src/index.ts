import type { MovieSource, TvShowSource } from 'packages/types/dist/index.js'
// import { db, tvShowsSchema } from '@repo/database'
// import { desc } from 'drizzle-orm'
import { getTvShowTopicId, upsertMovie, upsertTvShow } from './infra/database.js'
import { fetchCsfdId } from './scraper/fetchCsfdId.js'
import { indexMediaFromTopic } from './scraper/indexMediaFromTopic.js'
import { movieTopicIdMap, tvShowTopicIdMap } from './types/domain.js'
import { getMovieTopicId } from './utils/parsing.js'

export async function parseMovieTopics(): Promise<void> {
  // const lastRun = (await db.select().from(moviesSchema.movieSources).orderBy(desc(moviesSchema.movieSources.createdAt)).limit(1))?.[0]?.createdAt
  const lastRun = new Date('2025-06-09T12:00:00.000Z')

  for (const [topicId, topicType] of objectEntries(movieTopicIdMap)) {
    const movies = await indexMediaFromTopic(topicId, lastRun)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

export async function parseTvShowTopics(): Promise<void> {
  // const lastRun = (await db.select().from(tvShowsSchema.tvShowSources).orderBy(desc(tvShowsSchema.tvShowSources.createdAt)).limit(1))?.[0]?.createdAt
  const lastRun = new Date('2025-06-09T12:00:00.000Z')

  for (const [topicId, topicType] of objectEntries(tvShowTopicIdMap)) {
    const tvShows = await indexMediaFromTopic(topicId, lastRun)

    for (const tvShow of tvShows) {
      await upsertTvShow(tvShow, topicType)
    }
  }
}

export async function getCsfdMovieIdFromTopic(movie: MovieSource): Promise<string | null> {
  const topicId = getMovieTopicId(movie)
  return fetchCsfdId(topicId)
}

export async function getCsfdTvShowIdFromTopic(tvShow: TvShowSource): Promise<string | null> {
  const topicId = await getTvShowTopicId(tvShow)
  return fetchCsfdId(topicId)
}

function objectEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}
