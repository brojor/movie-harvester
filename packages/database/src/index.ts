import { env } from '@repo/shared'
import { drizzle } from 'drizzle-orm/libsql'
import * as moviesSchema from './db/schema/movies.js'

export const db = drizzle(env.DATABASE_URL)
export { moviesSchema }
