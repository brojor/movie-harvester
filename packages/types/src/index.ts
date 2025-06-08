import type { moviesSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.moviesSource.$inferSelect
