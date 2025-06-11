import type { moviesSchema, tvShowsSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.movieSources.$inferSelect
export type TvShowSource = typeof tvShowsSchema.tvShowSources.$inferSelect
export type CsfdMovieData = typeof moviesSchema.csfdMovieData.$inferSelect

export type TmdbNetwork = typeof tvShowsSchema.tmdbNetworks.$inferSelect
export type TmdbSeason = typeof tvShowsSchema.tmdbSeasons.$inferSelect
