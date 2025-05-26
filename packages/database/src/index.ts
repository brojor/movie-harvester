import { env } from '@repo/shared'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

export const db = drizzle(env.DATABASE_URL)
export { schema }
