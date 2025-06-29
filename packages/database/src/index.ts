import { env } from '@repo/shared'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as commonSchema from './db/schema/common.js'
import * as moviesSchema from './db/schema/movies.js'
import * as tvShowsSchema from './db/schema/tv-shows.js'

export const db = drizzle(env.DATABASE_URL!, { schema: { ...commonSchema, ...moviesSchema, ...tvShowsSchema } })
export { commonSchema, moviesSchema, tvShowsSchema }
// Export all types
export * from './types.js'

export { getLastProcessedDate, getUnprocessedSources } from './utils.js'
