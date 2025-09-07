import { createAllRepositories, createDatabase } from '@repo/database'
import { MediaService } from '@repo/media-service'
import { createQueues } from '@repo/queues'
import { movieTopicIdMap, tvShowTopicIdMap } from '@repo/shared'
import { createWarforumScraper } from '@repo/warforum-scraper'
import { databaseUrl, deprecationDate, redisOptions, warforumAgentOpts } from './env.js'

const db = createDatabase(databaseUrl)
const repositories = createAllRepositories(db)
const queues = createQueues(redisOptions)
const warforumScraper = createWarforumScraper(warforumAgentOpts, deprecationDate)

export async function parseMovieTopics(): Promise<void> {
  const mediaService = new MediaService(db, queues)
  const lastRun = await repositories.movieRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(movieTopicIdMap)) {
    const movieTopics = await warforumScraper.indexMediaFromTopic(topicId, lastRun)

    for (const movieTopic of movieTopics) {
      if (movieTopic.titles.length === 2) {
        const isDubbed = movieTopic.type === 'hdDub' || movieTopic.type === 'uhdDub'
        const [czechTitle, originalTitle] = isDubbed ? movieTopic.titles : movieTopic.titles.reverse()

        await mediaService.addMovieWithTopic({ czechTitle, originalTitle, year: (movieTopic as any).year }, movieTopic.id, topicType)
      }
      else {
        queues.tmdbMovieQueue.add('find-movie', movieTopic)
      }
    }
  }
}

export async function parseTvShowTopics(): Promise<void> {
  const mediaService = new MediaService(db, queues)
  const lastRun = await repositories.tvShowRepo.getLastUpdateDate()

  for (const [topicId, topicType] of objectEntries(tvShowTopicIdMap)) {
    const tvShowsTopics = await warforumScraper.indexMediaFromTopic(topicId, lastRun)

    for (const tvShowTopic of tvShowsTopics) {
      if (tvShowTopic.titles.length === 2) {
        const [czechTitle, originalTitle] = tvShowTopic.titles
        await mediaService.addTvShowWithTopic({ czechTitle, originalTitle }, (tvShowTopic as any).languages, tvShowTopic.id, topicType)
      }
      else {
        queues.tmdbTvShowQueue.add('find-tv-show', tvShowTopic)
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
