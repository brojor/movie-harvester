import type { Database, Transaction } from '@repo/database'
import type { TvShowTopicType, TvShowWithLanguages } from '@repo/types'
import { TvShowRepo, TvShowTopicsRepo } from '@repo/database'

export class TvShowService {
  constructor(private readonly db: Database) {}

  async addTvShowWithTopic(tvShow: TvShowWithLanguages, topicId: number, topicType: TvShowTopicType): Promise<void> {
    return this.db.transaction(async (tx: Transaction) => {
      const tvShowRepo = new TvShowRepo(tx)
      const tvShowTopicsRepo = new TvShowTopicsRepo(tx)

      const tvShowRecord = await tvShowRepo.addTvShow(tvShow)
      const languages = [...tvShow.languages].sort()

      await tvShowTopicsRepo.setTvShowTopicSource(tvShowRecord.id, languages, topicId, topicType)
    })
  }
}
