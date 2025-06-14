import { populateCsfdMoviesData } from 'apps/csfd-scraper/src/index.js'
import { populateRtMoviesData } from 'apps/rt-scraper/src/index.js'
import { populateTmdbMoviesData } from 'apps/tmdb-fetcher/src/index.js'
import { parseMovieTopics } from './apps/warforum-indexer/src/index.js'

async function main(): Promise<void> {
  await parseMovieTopics()
  await populateCsfdMoviesData()
  await populateRtMoviesData()
  await populateTmdbMoviesData({})
  console.log('✅ Done!')
}

main().catch(err => console.error('Fatal scraper error', err))
