import type { moviesSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.movieSources.$inferSelect
