import { populateCsfdData } from 'apps/csfd-scraper/src/index.js'
import { populateRtData } from 'apps/rt-scraper/src/index.js'
import { populateTmdbMoviesData } from 'apps/tmdb-fetcher/src/index.js'
import { parseMovieTopics } from './apps/warforum-indexer/src/index.js'

async function main(): Promise<void> {
  await parseMovieTopics()
  await populateCsfdData()
  await populateRtData()
  await populateTmdbMoviesData({})
  // await parseTvShowTopics()
  // await populateTmdbTvShowsData({ force: true })
  console.log('✅ Done!')
}

main().catch(err => console.error('Fatal scraper error', err))
