import type { Database, Transaction } from '@repo/database'
import type { Movie, MovieTopicType, TvShow, TvShowTopicType } from '@repo/types'
import { MovieRepo, MovieTopicsRepo, TvShowRepo, TvShowTopicsRepo } from '@repo/database'
import { csfdQueue, rtQueue, tmdbQueue } from '@repo/queues'

export class MediaService {
  constructor(private readonly db: Database) {}

  async addTvShowWithTopic(tvShow: TvShow, languages: string[], topicId: number, topicType: TvShowTopicType, tmdbId?: number): Promise<number> {
    return this.db.transaction(async (tx: Transaction) => {
      const tvShowRepo = new TvShowRepo(tx)
      const tvShowTopicsRepo = new TvShowTopicsRepo(tx)

      const tvShowRecord = await tvShowRepo.firstOrCreate(tvShow)

      await tvShowTopicsRepo.setTvShowTopicSource(tvShowRecord.id, languages.sort(), topicId, topicType)

      if (tmdbId) {
        await tvShowRepo.setTmdbId(tvShowRecord.id, tmdbId)
        csfdQueue.add('find-id', tvShowRecord)
        rtQueue.add('find-id', tvShowRecord)
      }
      else {
        csfdQueue.add('find-id', tvShowRecord)
        rtQueue.add('find-id', tvShowRecord)
        tmdbQueue.add('find-id', tvShowRecord)
      }

      return tvShowRecord.id
    })
  }

  async addMovieWithTopic(movie: Movie, topicId: number, topicType: MovieTopicType, tmdbId?: number): Promise<number> {
    return this.db.transaction(async (tx: Transaction) => {
      const movieRepo = new MovieRepo(tx)
      const movieTopicsRepo = new MovieTopicsRepo(tx)

      const movieRecord = await movieRepo.firstOrCreate(movie)

      await movieTopicsRepo.setMovieTopicSource(movieRecord.id, topicId, topicType)

      if (tmdbId) {
        await movieRepo.setTmdbId(movieRecord.id, tmdbId)
        csfdQueue.add('find-id', movieRecord)
        rtQueue.add('find-id', movieRecord)
      }
      else {
        csfdQueue.add('find-id', movieRecord)
        rtQueue.add('find-id', movieRecord)
        tmdbQueue.add('find-id', movieRecord)
      }

      return movieRecord.id
    })
  }
}
