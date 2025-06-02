import { populateRtData } from 'apps/rt-scraper/src/index.js'
import { populateTmdbData } from 'apps/tmdb-fetcher/src/index.js'
import { populateCsfdData } from './apps/csfd-scraper/src/index.js'
import { parseTopics } from './apps/warforum-indexer/src/index.js'

async function main(): Promise<void> {
  await parseTopics()
  await populateCsfdData()
  await populateRtData()
  await populateTmdbData()
  console.log('✅ Done!')
}

main().catch(err => console.error('Fatal scraper error', err))
