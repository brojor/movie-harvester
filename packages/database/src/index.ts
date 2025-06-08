import { env } from '@repo/shared/env'
import { drizzle } from 'drizzle-orm/libsql'
import * as commonSchema from './db/schema/common.js'
import * as moviesSchema from './db/schema/movies.js'

export const db = drizzle(env.DATABASE_URL)
export { commonSchema, moviesSchema }
