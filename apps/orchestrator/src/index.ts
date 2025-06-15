import process from 'node:process'
import { populateCsfdMoviesData } from '@repo/csfd-scraper'
import { populateRtMoviesData } from '@repo/rt-scraper'
import { populateTmdbMoviesData } from '@repo/tmdb-fetcher'
import { parseMovieTopics } from '@repo/warforum-indexer'

async function main(): Promise<void> {
  await parseMovieTopics()
  await populateCsfdMoviesData()
  await populateRtMoviesData()
  await populateTmdbMoviesData({})
  console.log('✅ Done!')
}

main().catch((err) => {
  console.error('Fatal scraper error', err)
  process.exit(1)
})
