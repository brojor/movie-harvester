// no sql import needed after migration
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}

export const csfdGenres = pgTable('csfd_genres', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})
