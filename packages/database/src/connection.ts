import { env } from '@repo/shared'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as commonSchema from './schemas/common.js'
import * as moviesSchema from './schemas/movies.js'
import * as tvShowsSchema from './schemas/tv-shows.js'

export type Database = ReturnType<typeof drizzle>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

let dbInstance: Database | null = null

export function createDatabase(): Database {
  if (!dbInstance) {
    dbInstance = drizzle(env.DATABASE_URL!, {
      schema: {
        ...moviesSchema,
        ...tvShowsSchema,
        ...commonSchema,
      },
    })
  }
  return dbInstance
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call createDatabase() first.')
  }
  return dbInstance
}
