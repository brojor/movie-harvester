import { drizzle } from 'drizzle-orm/node-postgres'
import * as commonSchema from './schemas/common.js'
import * as moviesSchema from './schemas/movies.js'
import * as tvShowsSchema from './schemas/tv-shows.js'

const schema = {
  ...moviesSchema,
  ...tvShowsSchema,
  ...commonSchema,
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createDatabase(databaseUrl: string) {
  return drizzle(databaseUrl, {
    schema,
  })
}

export type Database = ReturnType<typeof createDatabase>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
