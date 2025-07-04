import type { Database, Transaction } from '@repo/database'
import type { MovieTopicType, TvShowTopicType } from '@repo/shared'
import type { Movie, MovieRecord, TvShow, TvShowRecord } from '@repo/types'
import { MovieRepo, MovieTopicsRepo, TvShowRepo, TvShowTopicsRepo } from '@repo/database'
import { csfdMovieQueue, csfdTvShowQueue, rtMovieQueue, rtTvShowQueue, tmdbMovieQueue, tmdbTvShowQueue } from '@repo/queues'

export class MediaService {
  constructor(private readonly db: Database) {}

  async addTvShowWithTopic(tvShow: TvShow, languages: string[], topicId: number, topicType: TvShowTopicType, tmdbId?: number): Promise<number> {
    let tvShowRecord: TvShowRecord
    let wasCreated = false
    try {
      tvShowRecord = await this.db.transaction(async (tx: Transaction) => {
        const tvShowRepo = new TvShowRepo(tx)
        const tvShowTopicsRepo = new TvShowTopicsRepo(tx)

        const existingRecord = await tvShowRepo.find(tvShow)

        if (existingRecord) {
          await tvShowTopicsRepo.setTvShowTopicSource(existingRecord.id, languages.sort(), topicId, topicType)
          return existingRecord
        }

        wasCreated = true
        const newRecord = await tvShowRepo.create(tvShow)
        await tvShowTopicsRepo.setTvShowTopicSource(newRecord.id, languages.sort(), topicId, topicType)

        if (tmdbId) {
          await tvShowRepo.setTmdbId(newRecord.id, tmdbId)
          tmdbTvShowQueue.add('get-meta', { id: tmdbId })
        }

        return newRecord
      })
    }
    catch (error) {
      throw new Error(`Failed to add tv show ${tvShow.czechTitle} / ${tvShow.originalTitle} with topic ${topicId}: ${error}`)
    }

    if (wasCreated) {
      csfdTvShowQueue.add('find-id', tvShowRecord)
      rtTvShowQueue.add('find-id', tvShowRecord)
      if (!tmdbId)
        tmdbTvShowQueue.add('find-id', tvShowRecord)
    }

    return tvShowRecord.id
  }

  async addMovieWithTopic(movie: Movie, topicId: number, topicType: MovieTopicType, tmdbId?: number): Promise<number> {
    let movieRecord: MovieRecord
    let wasCreated = false
    try {
      movieRecord = await this.db.transaction(async (tx: Transaction) => {
        const movieRepo = new MovieRepo(tx)
        const movieTopicsRepo = new MovieTopicsRepo(tx)

        const existingRecord = await movieRepo.find(movie)
        if (existingRecord) {
          await movieTopicsRepo.setMovieTopicSource(existingRecord.id, topicId, topicType)
          return existingRecord
        }

        wasCreated = true
        const newRecord = await movieRepo.create(movie)
        await movieTopicsRepo.setMovieTopicSource(newRecord.id, topicId, topicType)

        if (tmdbId) {
          await movieRepo.setTmdbId(newRecord.id, tmdbId)
          tmdbMovieQueue.add('get-meta', { id: tmdbId })
        }

        return newRecord
      })
    }
    catch (error) {
      throw new Error(`Failed to add movie ${movie.czechTitle} / ${movie.originalTitle} with topic ${topicId}: ${error}`)
    }

    if (wasCreated) {
      csfdMovieQueue.add('find-id', movieRecord)
      rtMovieQueue.add('find-id', movieRecord)
      if (!tmdbId)
        tmdbMovieQueue.add('find-id', movieRecord)
    }

    return movieRecord.id
  }
}
