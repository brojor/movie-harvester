import process from 'node:process'
import { populateCsfdMoviesData, populateCsfdTvShowsData } from '@repo/csfd-scraper'
import { populateRtMoviesData, populateRtTvShowsData } from '@repo/rt-scraper'
import { populateTmdbMoviesData, populateTmdbTvShowsData } from '@repo/tmdb-fetcher'

import { parseMovieTopics, parseTvShowTopics } from '@repo/warforum-scraper'

async function main(): Promise<void> {
  await parseMovieTopics()
  await parseTvShowTopics()
  await populateCsfdMoviesData()
  await populateRtMoviesData()
  await populateTmdbMoviesData()
  await populateCsfdTvShowsData()
  await populateRtTvShowsData()
  await populateTmdbTvShowsData()

  console.log('✅ Done!')
}

main().catch((err) => {
  console.error('Fatal scraper error', err)
  process.exit(1)
})
