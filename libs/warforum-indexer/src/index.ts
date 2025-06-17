import type { MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import { getLastProcessedMovieDate, getLastProcessedTvShowDate, getTvShowTopicId, upsertMovie, upsertTvShow } from './infra/database.js'
import { fetchCsfdId } from './scraper/fetchCsfdId.js'
import { indexMediaFromTopic } from './scraper/indexMediaFromTopic.js'
import { movieTopicIdMap, tvShowTopicIdMap } from './types/domain.js'
import { getMovieTopicId } from './utils/parsing.js'

export async function parseMovieTopics(): Promise<void> {
  const lastRun = await getLastProcessedMovieDate()

  for (const [topicId, topicType] of objectEntries(movieTopicIdMap)) {
    const movies = await indexMediaFromTopic(topicId, lastRun)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

export async function parseTvShowTopics(): Promise<void> {
  const lastRun = await getLastProcessedTvShowDate()

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
