import { createDatabase, MovieRepo, TvShowRepo } from '@repo/database'
import { MediaService } from '@repo/media-service'
import { tmdbQueue } from '@repo/queues'
import { movieTopicIdMap, tvShowTopicIdMap } from '@repo/shared'
import { indexMediaFromTopic } from '@repo/warforum-scraper'

const db = createDatabase()
export async function parseMovieTopics(): Promise<void> {
  const mediaService = new MediaService(db)
  const movieRepo = new MovieRepo(db)
  const lastRun = await movieRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(movieTopicIdMap)) {
    const movieTopics = await indexMediaFromTopic(topicId, lastRun)

    for (const movieTopic of movieTopics) {
      if (movieTopic.titles.length === 2) {
        const isDubbed = movieTopic.type === 'hdDub' || movieTopic.type === 'uhdDub'
        const [czechTitle, originalTitle] = isDubbed ? movieTopic.titles : movieTopic.titles.reverse()

        await mediaService.addMovieWithTopic({ czechTitle, originalTitle, year: movieTopic.year }, topicId, topicType)
      }
      else {
        tmdbQueue.add('find-movie', movieTopic)
      }
    }
  }
}

export async function parseTvShowTopics(): Promise<void> {
  const mediaService = new MediaService(db)
  const tvShowRepo = new TvShowRepo(db)
  const lastRun = await tvShowRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(tvShowTopicIdMap)) {
    const tvShowsTopics = await indexMediaFromTopic(topicId, lastRun)

    for (const tvShowTopic of tvShowsTopics) {
      if (tvShowTopic.titles.length === 2) {
        const [czechTitle, originalTitle] = tvShowTopic.titles
        await mediaService.addTvShowWithTopic({ czechTitle, originalTitle }, tvShowTopic.languages, tvShowTopic.id, topicType)
      }
      else {
        tmdbQueue.add('find-tv-show', tvShowTopic)
      }
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
