import { createClient } from '@libsql/client'
import { env } from '@repo/shared/env'
import { drizzle } from 'drizzle-orm/libsql'
import * as commonSchema from './db/schema/common.js'
import * as moviesSchema from './db/schema/movies.js'
import * as tvShowsSchema from './db/schema/tv-shows.js'

const client = createClient({ url: env.DATABASE_URL })
export const db = drizzle(client, { schema: { ...commonSchema, ...moviesSchema, ...tvShowsSchema } })
export { commonSchema, moviesSchema, tvShowsSchema }
