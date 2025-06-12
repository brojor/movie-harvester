import { sql } from 'drizzle-orm'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const timestamps = {
  createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}

export const csfdGenres = sqliteTable('csfd_genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})
