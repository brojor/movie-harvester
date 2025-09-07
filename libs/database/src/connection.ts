import { drizzle } from 'drizzle-orm/node-postgres'
import * as commonSchema from './schemas/common.js'
import * as moviesSchema from './schemas/movies.js'
import * as tvShowsSchema from './schemas/tv-shows.js'

const schema = {
  ...moviesSchema,
  ...tvShowsSchema,
  ...commonSchema,
}

let dbInstance: ReturnType<typeof drizzle> | null = null

export function createDatabase(databaseUrl: string): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    dbInstance = drizzle(databaseUrl, {
      schema,
    })
  }
  return dbInstance
}

export function getDatabase(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call createDatabase() first.')
  }
  return dbInstance
}

export type Database = ReturnType<typeof drizzle>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
