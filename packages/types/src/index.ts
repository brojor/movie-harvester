import type { moviesSchema, tvShowsSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.movieSources.$inferSelect
export type TvShowSource = typeof tvShowsSchema.tvShowSources.$inferSelect
export type CsfdMovieData = typeof moviesSchema.csfdMovieData.$inferSelect

export type TvShowNetwork = typeof tvShowsSchema.networks.$inferSelect
export type TvShowSeason = typeof tvShowsSchema.seasons.$inferSelect
