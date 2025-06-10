import { populateTmdbTvShowsData } from 'apps/tmdb-fetcher/src/index.js'
import { parseTvShowTopics } from './apps/warforum-indexer/src/index.js'

async function main(): Promise<void> {
  // await parseMovieTopics()
  // await populateCsfdData()
  // await populateRtData()
  // await populateTmdbMoviesData()
  await parseTvShowTopics()
  await populateTmdbTvShowsData({ force: true })
  console.log('✅ Done!')
}

main().catch(err => console.error('Fatal scraper error', err))
