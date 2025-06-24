import { createDatabase, MovieRepo, MovieTopicsRepo, TvShowRepo, TvShowTopicsRepo } from '@repo/database'
import { csfdQueue, rtQueue, tmdbQueue } from '@repo/queues'
import { movieTopicIdMap, tvShowTopicIdMap } from '@repo/types'
import { indexMediaFromTopic } from '@repo/warforum-scraper'

const db = createDatabase()
export async function parseMovieTopics(): Promise<void> {
  const movieRepo = new MovieRepo(db)
  const movieTopicsRepo = new MovieTopicsRepo(db)
  const lastRun = await movieRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(movieTopicIdMap)) {
    const movies = await indexMediaFromTopic(topicId, lastRun)

    for (const movie of movies) {
      const movieRecord = await movieRepo.firstOrCreate(movie.coreMeta)
      await movieTopicsRepo.setMovieTopicSource(movieRecord.id, topicId, topicType)

      if (!movieRecord.csfdId)
        csfdQueue.add('find-id', movieRecord)
      if (!movieRecord.rtId)
        rtQueue.add('find-id', movieRecord)
      if (!movieRecord.tmdbId)
        tmdbQueue.add('find-id', movieRecord)
    }
  }
}

export async function parseTvShowTopics(): Promise<void> {
  const tvShowRepo = new TvShowRepo(db)
  const tvShowTopicsRepo = new TvShowTopicsRepo(db)
  const lastRun = await tvShowRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(tvShowTopicIdMap)) {
    const tvShows = await indexMediaFromTopic(topicId, lastRun)

    for (const tvShow of tvShows) {
      const tvShowRecord = await tvShowRepo.addTvShow(tvShow.coreMeta)
      await tvShowTopicsRepo.setTvShowTopicSource(tvShowRecord.id, tvShow.coreMeta.languages, topicId, topicType)
      csfdQueue.add('find-id', tvShowRecord)
      rtQueue.add('find-id', tvShowRecord)
      tmdbQueue.add('find-id', tvShowRecord)
    }
  }
}

function objectEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

async function main(): Promise<void> {
  await parseMovieTopics()
  await parseTvShowTopics()
}

main()
