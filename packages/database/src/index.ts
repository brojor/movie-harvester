import { env } from '@repo/shared'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema.js'

export const db = drizzle(env.get('DATABASE_URL')!)
export type { InferModel } from 'drizzle-orm'
export { schema }
